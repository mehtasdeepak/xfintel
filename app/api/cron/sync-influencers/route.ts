import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const HANDLES = [
  "Gubloinvestor", "aleabitoreddit", "SJCapitalInvest", "TheRonnieVShow",
  "MitchMartan98", "jrouldz", "StockSavvyShay", "Ashton_1nvests",
  "WheelieInvestor", "EndicottInvests", "HeeraniPK", "amitisinvesting",
  "anni_sen", "retail_mourinho", "mvcinvesting", "anandragn", "RKLBMan",
  "wealthmatica", "ZaStocks", "Mr_Derivatives", "itschrisray", "ParadisLabs",
  "illyquid", "damnang2", "PhotonCap", "pepemoonboy", "crux_capital_",
  "Frenchie_", "Blinklebloop", "KawzInvests", "degentradingLSD",
  "michaelsikand", "Kaizen_Investor", "Yeah_Dave", "TheValueist",
];

type XUser = {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  public_metrics: { followers_count: number };
};

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    return NextResponse.json({ error: "X_BEARER_TOKEN is not set" }, { status: 500 });
  }

  const t0 = Date.now();

  const params = new URLSearchParams({
    usernames: HANDLES.join(","),
    "user.fields": "profile_image_url,public_metrics",
  });

  const xRes = await fetch(
    `https://api.twitter.com/2/users/by?${params}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );

  if (!xRes.ok) {
    return NextResponse.json(
      { error: `X API error ${xRes.status}`, detail: await xRes.text() },
      { status: 502 }
    );
  }

  const xData = await xRes.json() as {
    data?: XUser[];
    errors?: { value: string; detail: string }[];
  };

  const found = xData.data ?? [];
  const notFound = (xData.errors ?? []).map((e) => e.value);
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
    ok: failed.length === 0,
    synced_count: synced.length,
    synced,
    failed_count: failed.length,
    failed,
    not_found_on_x: notFound,
    time_ms: Date.now() - t0,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
