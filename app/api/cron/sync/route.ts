import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Max duration hint for Vercel Pro (ignored on hobby, harmless either way)
export const maxDuration = 300;

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

// ─── Step 1: Sync influencer profiles ────────────────────────────────────────

// Keep this list in sync with app/api/sync-influencers/route.ts
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

type Step1Result = {
  synced_count: number;
  synced: string[];
  failed_count: number;
  failed: { handle: string; error: string }[];
  not_found_on_x: string[];
  time_ms: number;
};

async function stepSyncInfluencers(bearerToken: string): Promise<Step1Result> {
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
    throw new Error(`X API error ${xRes.status}: ${await xRes.text()}`);
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

  return {
    synced_count: synced.length,
    synced,
    failed_count: failed.length,
    failed,
    not_found_on_x: notFound,
    time_ms: Date.now() - t0,
  };
}

// ─── Step 2: Sync recent posts (2-hour window) ────────────────────────────────

type Step2Result = {
  total_posts_synced: number;
  influencer_breakdown: { influencer: string; posts_synced: number; error?: string }[];
  time_ms: number;
};

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

async function stepSyncPosts(bearerToken: string): Promise<Step2Result> {
  const t0 = Date.now();
  // 2-hour lookback for the cron cadence
  const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: influencers, error: dbError } = await supabase
    .from("influencers")
    .select("id, x_handle, display_name")
    .eq("is_active", true);

  if (dbError) throw new Error(`Supabase fetch error: ${dbError.message}`);
  if (!influencers || influencers.length === 0) {
    return { total_posts_synced: 0, influencer_breakdown: [], time_ms: Date.now() - t0 };
  }

  // Batch-resolve x_handle → X user ID
  const usernames = (influencers as InfluencerRow[]).map((i) =>
    i.x_handle.replace(/^@/, "")
  );
  const usersRes = await fetch(
    `https://api.twitter.com/2/users/by?usernames=${usernames.join(",")}&user.fields=id`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  if (!usersRes.ok) throw new Error(`X user lookup failed: ${usersRes.status}`);

  const usersData = await usersRes.json() as { data?: { id: string; username: string }[] };
  const xIdByUsername = new Map<string, string>();
  for (const u of usersData.data ?? []) {
    xIdByUsername.set(u.username.toLowerCase(), u.id);
  }

  const breakdown: Step2Result["influencer_breakdown"] = [];

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
        category: "noise" as const,   // picked up by step 3
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
  return { total_posts_synced: total, influencer_breakdown: breakdown, time_ms: Date.now() - t0 };
}

// ─── Step 3: Categorize posts with category = 'noise' ────────────────────────

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CATEGORIZE_LIMIT = 50; // cap per cron run to stay within timeout
const POST_DELAY_MS = 300;

type ClaudeCategory =
  | "trade_call" | "position_update" | "exit" | "performance"
  | "portfolio" | "watchlist" | "analysis" | "noise";

type ClaudeResult = {
  category: ClaudeCategory;
  ticker: string | null;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
};

type Step3Result = {
  total_categorized: number;
  category_breakdown: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  average_confidence: number;
  failed_count: number;
  time_ms: number;
};

function buildPrompt(content: string): string {
  return `You are a financial social media post categorizer for a platform that tracks financial influencers on X (Twitter).

Categorize this post into exactly one category:
- trade_call: Direct recommendation to buy/long or sell/short a specific asset
- position_update: Modifying an existing position (moving stops, adding more, scaling in/out)
- exit: Full or partial closure of a position
- performance: Reporting a PnL result, gain or loss on a closed or active trade
- portfolio: Current holdings snapshot or portfolio allocation
- watchlist: Expressing interest in an asset without executing
- analysis: Technical or fundamental commentary without an immediate trade action
- noise: Everything else (motivational quotes, news sharing, general chat)

Also identify:
- ticker: The primary stock/crypto ticker mentioned (e.g. NVDA, TSLA, BTC) or null if none
- sentiment: bullish, bearish, or neutral
- confidence: A score from 0.0 to 1.0 of how confident you are in this categorization

Post: ${content}

Respond with ONLY a valid JSON object in this exact format, nothing else:
{
  "category": "category_name",
  "ticker": "TICKER_OR_NULL",
  "sentiment": "bullish/bearish/neutral",
  "confidence": 0.00
}`;
}

async function classifyPost(content: string, apiKey: string): Promise<ClaudeResult> {
  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: buildPrompt(content) }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);

  const body = await res.json();
  const raw: string = body.content?.[0]?.text ?? "";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned) as ClaudeResult;

  if ((parsed.category as string) === "news") parsed.category = "noise";
  if (!parsed.ticker || ["NULL", "TICKER_OR_NULL"].includes(parsed.ticker.toUpperCase())) {
    parsed.ticker = null;
  } else {
    parsed.ticker = parsed.ticker.toUpperCase();
  }

  return parsed;
}

async function stepCategorizePosts(apiKey: string): Promise<Step3Result> {
  const t0 = Date.now();
  const categoryBreakdown: Record<string, number> = {};
  const sentimentBreakdown: Record<string, number> = {};
  let totalCategorized = 0;
  let confidenceSum = 0;
  let failedCount = 0;

  const { data: posts, error: fetchError } = await supabase
    .from("posts")
    .select("id, content, ticker_symbols")
    .eq("category", "noise")
    .limit(CATEGORIZE_LIMIT);

  if (fetchError) throw new Error(`Supabase fetch error: ${fetchError.message}`);
  if (!posts || posts.length === 0) {
    return {
      total_categorized: 0,
      category_breakdown: {},
      sentiment_breakdown: {},
      average_confidence: 0,
      failed_count: 0,
      time_ms: Date.now() - t0,
    };
  }

  for (let i = 0; i < posts.length; i++) {
    if (i > 0) await sleep(POST_DELAY_MS);

    const post = posts[i] as { id: string; content: string; ticker_symbols: string[] };
    let result: ClaudeResult;

    try {
      result = await classifyPost(post.content, apiKey);
    } catch {
      failedCount++;
      continue;
    }

    const existing: string[] = post.ticker_symbols ?? [];
    const mergedTickers =
      result.ticker && !existing.includes(result.ticker)
        ? [...existing, result.ticker]
        : existing;

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        category: result.category,
        sentiment: result.sentiment,
        confidence: result.confidence,
        ticker_symbols: mergedTickers,
      })
      .eq("id", post.id);

    if (updateError) {
      failedCount++;
      continue;
    }

    totalCategorized++;
    confidenceSum += result.confidence;
    categoryBreakdown[result.category] = (categoryBreakdown[result.category] ?? 0) + 1;
    sentimentBreakdown[result.sentiment] = (sentimentBreakdown[result.sentiment] ?? 0) + 1;
  }

  return {
    total_categorized: totalCategorized,
    category_breakdown: categoryBreakdown,
    sentiment_breakdown: sentimentBreakdown,
    average_confidence:
      totalCategorized > 0
        ? Math.round((confidenceSum / totalCategorized) * 1000) / 1000
        : 0,
    failed_count: failedCount,
    time_ms: Date.now() - t0,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bearerToken = process.env.X_BEARER_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!bearerToken) {
    return NextResponse.json({ error: "X_BEARER_TOKEN is not set" }, { status: 500 });
  }
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }

  const cronStart = Date.now();
  const errors: string[] = [];

  // Step 1: Refresh influencer profiles
  let step1: Step1Result | { error: string; time_ms: number };
  try {
    step1 = await stepSyncInfluencers(bearerToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`step1: ${msg}`);
    step1 = { error: msg, time_ms: 0 };
  }

  // Step 2: Pull new posts from last 2 hours
  let step2: Step2Result | { error: string; time_ms: number };
  try {
    step2 = await stepSyncPosts(bearerToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`step2: ${msg}`);
    step2 = { error: msg, time_ms: 0 };
  }

  // Step 3: Categorize uncategorized posts
  let step3: Step3Result | { error: string; time_ms: number };
  try {
    step3 = await stepCategorizePosts(anthropicKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`step3: ${msg}`);
    step3 = { error: msg, time_ms: 0 };
  }

  return NextResponse.json({
    ok: errors.length === 0,
    total_time_ms: Date.now() - cronStart,
    errors: errors.length > 0 ? errors : undefined,
    steps: {
      sync_influencers: step1,
      sync_posts: step2,
      categorize_posts: step3,
    },
  });
}
