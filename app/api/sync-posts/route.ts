import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TWEETS_URL = (userId: string) =>
  `https://api.twitter.com/2/users/${userId}/tweets`;

const USERS_BY_URL = "https://api.twitter.com/2/users/by";

type XTweet = {
  id: string;
  text: string;
  created_at: string;
};

type XUserLookup = {
  id: string;
  username: string;
};

type XUsersResponse = {
  data?: XUserLookup[];
  errors?: { value: string; detail: string }[];
};

type XTweetsResponse = {
  data?: XTweet[];
  meta?: { next_token?: string; result_count: number };
  errors?: { message: string }[];
};

type InfluencerRow = {
  id: string;
  x_handle: string;
  display_name: string;
};

function extractTickers(text: string): string[] {
  const matches = text.matchAll(/\$([A-Za-z]{1,5})\b/g);
  const tickers = new Set<string>();
  for (const match of matches) {
    tickers.add(match[1].toUpperCase());
  }
  return Array.from(tickers);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllTweets(
  userId: string,
  bearerToken: string
): Promise<XTweet[]> {
  const startTime = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  ).toISOString();

  const allTweets: XTweet[] = [];
  let nextToken: string | undefined;

  do {
    const params = new URLSearchParams({
      start_time: startTime,
      max_results: "100",
      exclude: "replies,retweets",
      "tweet.fields": "id,text,created_at,entities",
    });
    if (nextToken) params.set("pagination_token", nextToken);

    const res = await fetch(`${TWEETS_URL(userId)}?${params}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    if (!res.ok) {
      throw new Error(`X API ${res.status}: ${await res.text()}`);
    }

    const body: XTweetsResponse = await res.json();

    if (body.data) allTweets.push(...body.data);
    nextToken = body.meta?.next_token;
  } while (nextToken);

  return allTweets;
}

export async function POST() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    return NextResponse.json(
      { error: "X_BEARER_TOKEN environment variable is not set" },
      { status: 500 }
    );
  }

  // 1. Fetch all active influencers from Supabase
  const { data: influencers, error: dbError } = await supabase
    .from("influencers")
    .select("id, x_handle, display_name")
    .eq("is_active", true);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  if (!influencers || influencers.length === 0) {
    return NextResponse.json({ error: "No active influencers found" }, { status: 404 });
  }

  // 2. Batch resolve x_handle → X user ID (strip leading @)
  const usernames = (influencers as InfluencerRow[]).map((inf) =>
    inf.x_handle.replace(/^@/, "")
  );

  const usersRes = await fetch(
    `${USERS_BY_URL}?usernames=${usernames.join(",")}&user.fields=id`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );

  if (!usersRes.ok) {
    return NextResponse.json(
      { error: `X user lookup failed: ${usersRes.status}`, detail: await usersRes.text() },
      { status: 502 }
    );
  }

  const usersData: XUsersResponse = await usersRes.json();

  // Build username → X ID map (usernames are case-insensitive on X)
  const xIdByUsername = new Map<string, string>();
  for (const user of usersData.data ?? []) {
    xIdByUsername.set(user.username.toLowerCase(), user.id);
  }

  // 3. Sync posts for each influencer
  const summary: {
    influencer: string;
    posts_synced: number;
    error?: string;
  }[] = [];

  // TEST MODE: skipping @Gubloinvestor — revert by removing the filter below
  const influencersToProcess = (influencers as InfluencerRow[]).filter(
    (inf) => inf.x_handle !== "@Gubloinvestor"
  );

  for (let i = 0; i < influencersToProcess.length; i++) {
    const inf = influencersToProcess[i];
    const username = inf.x_handle.replace(/^@/, "").toLowerCase();
    const xUserId = xIdByUsername.get(username);

    if (!xUserId) {
      summary.push({
        influencer: inf.display_name,
        posts_synced: 0,
        error: "X user ID not found — account may be suspended or not exist",
      });
      continue;
    }

    if (i > 0) await sleep(1000);

    try {
      const tweets = await fetchAllTweets(xUserId, bearerToken);

      if (tweets.length === 0) {
        summary.push({ influencer: inf.display_name, posts_synced: 0 });
        continue;
      }

      const records = tweets.map((tweet) => ({
        influencer_id: inf.id,
        x_post_id: tweet.id,
        content: tweet.text,
        category: "opinion" as const,
        ticker_symbols: extractTickers(tweet.text),
        posted_at: tweet.created_at,
      }));

      const { error: upsertError } = await supabase
        .from("posts")
        .upsert(records, { onConflict: "x_post_id" });

      if (upsertError) {
        summary.push({
          influencer: inf.display_name,
          posts_synced: 0,
          error: upsertError.message,
        });
      } else {
        summary.push({ influencer: inf.display_name, posts_synced: tweets.length });
      }
    } catch (err) {
      summary.push({
        influencer: inf.display_name,
        posts_synced: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const totalSynced = summary.reduce((sum, s) => sum + s.posts_synced, 0);

  return NextResponse.json({
    total_posts_synced: totalSynced,
    influencer_breakdown: summary,
  });
}
