import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 120;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTickers(text: string): string[] {
  const tickers = new Set<string>();
  for (const match of text.matchAll(/\$([A-Za-z]{1,5})\b/g)) {
    tickers.add(match[1].toUpperCase());
  }
  return Array.from(tickers);
}

type XTweet = { id: string; text: string; created_at: string };
type InfluencerRow = { id: string; x_handle: string; display_name: string };

async function fetchRecentTweets(
  userId: string,
  bearerToken: string,
  startTime: string
): Promise<XTweet[]> {
  const params = new URLSearchParams({
    start_time: startTime,
    max_results: "100",
    exclude: "replies,retweets",
    "tweet.fields": "id,text,created_at",
  });

  const res = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?${params}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );

  if (!res.ok) throw new Error(`X API ${res.status}: ${await res.text()}`);

  const body = await res.json() as { data?: XTweet[] };
  return body.data ?? [];
}

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    return NextResponse.json({ error: "X_BEARER_TOKEN is not set" }, { status: 500 });
  }

  const t0 = Date.now();
  const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: influencers, error: dbError } = await supabase
    .from("influencers")
    .select("id, x_handle, display_name")
    .eq("is_active", true);

  if (dbError) {
    return NextResponse.json({ error: `Supabase fetch error: ${dbError.message}` }, { status: 500 });
  }
  if (!influencers || influencers.length === 0) {
    return NextResponse.json({ ok: true, total_posts_synced: 0, influencer_breakdown: [], time_ms: Date.now() - t0 });
  }

  const usernames = (influencers as InfluencerRow[]).map((i) => i.x_handle.replace(/^@/, ""));
  const usersRes = await fetch(
    `https://api.twitter.com/2/users/by?usernames=${usernames.join(",")}&user.fields=id`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  if (!usersRes.ok) {
    return NextResponse.json({ error: `X user lookup failed: ${usersRes.status}` }, { status: 502 });
  }

  const usersData = await usersRes.json() as { data?: { id: string; username: string }[] };
  const xIdByUsername = new Map<string, string>();
  for (const u of usersData.data ?? []) {
    xIdByUsername.set(u.username.toLowerCase(), u.id);
  }

  const breakdown: { influencer: string; posts_synced: number; error?: string }[] = [];

  for (let i = 0; i < (influencers as InfluencerRow[]).length; i++) {
    const inf = (influencers as InfluencerRow[])[i];
    const username = inf.x_handle.replace(/^@/, "").toLowerCase();
    const xUserId = xIdByUsername.get(username);

    if (!xUserId) {
      breakdown.push({ influencer: inf.display_name, posts_synced: 0, error: "X user ID not found" });
      continue;
    }

    if (i > 0) await sleep(1000);

    try {
      const tweets = await fetchRecentTweets(xUserId, bearerToken, startTime);
      if (tweets.length === 0) {
        breakdown.push({ influencer: inf.display_name, posts_synced: 0 });
        continue;
      }

      const records = tweets.map((tweet) => ({
        influencer_id: inf.id,
        x_post_id: tweet.id,
        content: tweet.text,
        category: "noise" as const,
        ticker_symbols: extractTickers(tweet.text),
        posted_at: tweet.created_at,
      }));

      const { error: upsertError } = await supabase
        .from("posts")
        .upsert(records, { onConflict: "x_post_id" });

      if (upsertError) {
        breakdown.push({ influencer: inf.display_name, posts_synced: 0, error: upsertError.message });
      } else {
        breakdown.push({ influencer: inf.display_name, posts_synced: tweets.length });
      }
    } catch (err) {
      breakdown.push({
        influencer: inf.display_name,
        posts_synced: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const total = breakdown.reduce((sum, b) => sum + b.posts_synced, 0);
  return NextResponse.json({
    ok: true,
    total_posts_synced: total,
    influencer_breakdown: breakdown,
    time_ms: Date.now() - t0,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
