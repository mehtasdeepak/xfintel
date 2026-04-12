import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const HANDLES = [
  "Gubloinvestor",
  "aleabitoreddit",
  "SJCapitalInvest",
  "TheRonnieVShow",
  "MitchMartan98",
  "jrouldz",
  "StockSavvyShay",
  "Ashton_1nvests",
  "WheelieInvestor",
  "EndicottInvests",
  "HeeraniPK",
  "amitisinvesting",
  "anni_sen",
  "retail_mourinho",
  "mvcinvesting",
  "anandragn",
  "RKLBMan",
];

// X API v2 — look up up to 100 usernames in one request
const X_USERS_URL = "https://api.twitter.com/2/users/by";

type XUser = {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  public_metrics: { followers_count: number };
};

type XApiResponse = {
  data?: XUser[];
  errors?: { value: string; detail: string }[];
};

export async function POST() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    return NextResponse.json(
      { error: "X_BEARER_TOKEN environment variable is not set" },
      { status: 500 }
    );
  }

  // Fetch all handles in a single X API request
  const params = new URLSearchParams({
    usernames: HANDLES.join(","),
    "user.fields": "profile_image_url,public_metrics",
  });

  const xRes = await fetch(`${X_USERS_URL}?${params}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!xRes.ok) {
    const body = await xRes.text();
    return NextResponse.json(
      { error: `X API error ${xRes.status}`, detail: body },
      { status: 502 }
    );
  }

  const xData: XApiResponse = await xRes.json();

  const found = xData.data ?? [];
  const notFound = (xData.errors ?? []).map((e) => e.value);

  // Upsert each resolved user into Supabase
  const synced: string[] = [];
  const failed: { handle: string; error: string }[] = [];

  for (const user of found) {
    const record = {
      x_handle: `@${user.username}`,
      display_name: user.name,
      profile_image_url: user.profile_image_url,
      follower_count: user.public_metrics.followers_count,
    };

    const { error } = await supabase
      .from("influencers")
      .upsert(record, { onConflict: "x_handle" });

    if (error) {
      failed.push({ handle: record.x_handle, error: error.message });
    } else {
      synced.push(record.x_handle);
    }
  }

  return NextResponse.json({
    synced_count: synced.length,
    synced,
    failed_count: failed.length,
    failed,
    not_found_on_x: notFound,
  });
}
