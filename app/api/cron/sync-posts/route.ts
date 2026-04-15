import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 120;

// Influencer profiles are synced separately by /api/cron/sync-influencers (daily).
// This route only pulls posts + categorizes. Kept lean to stay under timeout.

const INFLUENCER_BATCH = 20;   // influencers per run (rotates through full list)
const POST_WINDOW_MS  = 30 * 60 * 1000; // 30-minute lookback
const MAX_CAT_BATCHES = 2;     // max categorization batches per run

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

// ─── Post sync ────────────────────────────────────────────────────────────────

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

// ─── Categorization ───────────────────────────────────────────────────────────

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const BATCH_SIZE = 30;
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

type CategorizeResult = {
  total_categorized: number;
  category_breakdown: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  average_confidence: number;
  failed_count: number;
  batches_run: number;
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

async function categorizeNoisePosts(
  apiKey: string,
  deadline: number
): Promise<CategorizeResult> {
  const categoryBreakdown: Record<string, number> = {};
  const sentimentBreakdown: Record<string, number> = {};
  let totalCategorized = 0;
  let confidenceSum = 0;
  let failedCount = 0;
  let batchesRun = 0;

  // Log total noise posts before starting
  const { count: noiseCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("category", "noise");
  console.log(`[categorize] noise posts pending: ${noiseCount ?? "unknown"}`);

  while (Date.now() < deadline && batchesRun < MAX_CAT_BATCHES) {
    const { data: posts, error: fetchError } = await supabase
      .from("posts")
      .select("id, content, ticker_symbols")
      .eq("category", "noise")
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error(`[categorize] supabase fetch error: ${fetchError.message}`);
      break;
    }
    if (!posts || posts.length === 0) {
      console.log(`[categorize] no noise posts remaining, stopping`);
      break;
    }

    batchesRun++;
    console.log(`[categorize] starting batch ${batchesRun}/${MAX_CAT_BATCHES}, categorizing ${posts.length} posts`);

    for (let i = 0; i < posts.length; i++) {
      if (Date.now() >= deadline) {
        console.log(`[categorize] deadline reached, stopping mid-batch at post ${i}/${posts.length}`);
        break;
      }
      if (i > 0) await sleep(POST_DELAY_MS);

      const post = posts[i] as { id: string; content: string; ticker_symbols: string[] };
      let result: ClaudeResult;

      try {
        result = await classifyPost(post.content, apiKey);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[categorize] classify error for post ${post.id}: ${msg}`);
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
        console.error(`[categorize] supabase update error for post ${post.id}: ${updateError.message}`);
        failedCount++;
        continue;
      }

      totalCategorized++;
      confidenceSum += result.confidence;
      categoryBreakdown[result.category] = (categoryBreakdown[result.category] ?? 0) + 1;
      sentimentBreakdown[result.sentiment] = (sentimentBreakdown[result.sentiment] ?? 0) + 1;
    }

    // If the batch wasn't full, no more noise posts remain
    if (posts.length < BATCH_SIZE) break;
  }

  console.log(`[categorize] done — categorized: ${totalCategorized}, failed: ${failedCount}, batches: ${batchesRun}`);

  return {
    total_categorized: totalCategorized,
    category_breakdown: categoryBreakdown,
    sentiment_breakdown: sentimentBreakdown,
    average_confidence:
      totalCategorized > 0
        ? Math.round((confidenceSum / totalCategorized) * 1000) / 1000
        : 0,
    failed_count: failedCount,
    batches_run: batchesRun,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bearerToken = process.env.X_BEARER_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!bearerToken) {
    console.error("[sync-posts] X_BEARER_TOKEN not found");
    return NextResponse.json({ error: "X_BEARER_TOKEN is not set" }, { status: 500 });
  }
  if (!anthropicKey) {
    console.error("[sync-posts] ANTHROPIC_API_KEY not found");
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }
  console.log("[sync-posts] env vars present, starting sync");

  const t0 = Date.now();
  // Reserve last 60s of maxDuration for categorization
  const categorizationDeadline = t0 + (maxDuration - 60) * 1000;
  const startTime = new Date(t0 - POST_WINDOW_MS).toISOString();

  // ── Step 1: Select 20 influencers for this run (rotating window) ──────────
  //
  // Deterministic rotation: order all active influencers by x_handle (stable),
  // derive a batch index from the current 15-min slot, slice INFLUENCER_BATCH.
  // With 35 influencers and batch=20: slot 0 → [0..19], slot 1 → [20..34+wrap],
  // cycling every 2 runs (30 min) so all 35 are covered within 30 minutes.

  const { data: allInfluencers, error: dbError } = await supabase
    .from("influencers")
    .select("id, x_handle, display_name")
    .eq("is_active", true)
    .order("x_handle", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: `Supabase fetch error: ${dbError.message}` }, { status: 500 });
  }
  if (!allInfluencers || allInfluencers.length === 0) {
    return NextResponse.json({
      ok: true,
      total_posts_synced: 0,
      influencer_breakdown: [],
      categorization: null,
      time_ms: Date.now() - t0,
    });
  }

  const total = allInfluencers.length;
  // Each 15-min cron slot gets a unique index
  const slotIndex = Math.floor(t0 / (15 * 60 * 1000));
  const offset = (slotIndex * INFLUENCER_BATCH) % total;

  // Slice with wrap-around so we always get exactly INFLUENCER_BATCH (or total if smaller)
  const batchSize = Math.min(INFLUENCER_BATCH, total);
  const influencers: InfluencerRow[] = [];
  for (let i = 0; i < batchSize; i++) {
    influencers.push(allInfluencers[(offset + i) % total] as InfluencerRow);
  }

  console.log(`[sync-posts] slot ${slotIndex}, offset ${offset}, syncing ${influencers.length}/${total} influencers`);

  // ── Step 2: Resolve X user IDs for this batch only ────────────────────────

  const usernames = influencers.map((i) => i.x_handle.replace(/^@/, ""));
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

  // ── Step 3: Pull posts for each influencer in batch ───────────────────────

  const breakdown: { influencer: string; posts_synced: number; error?: string }[] = [];

  for (let i = 0; i < influencers.length; i++) {
    const inf = influencers[i];
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

  const totalSynced = breakdown.reduce((sum, b) => sum + b.posts_synced, 0);
  console.log(`[sync-posts] posts synced: ${totalSynced}`);

  // ── Step 4: Categorize noise posts (max 2 batches of 30) ─────────────────

  const categorization = await categorizeNoisePosts(anthropicKey, categorizationDeadline);

  return NextResponse.json({
    ok: true,
    slot_index: slotIndex,
    influencers_in_batch: influencers.length,
    total_influencers: total,
    total_posts_synced: totalSynced,
    influencer_breakdown: breakdown,
    categorization,
    time_ms: Date.now() - t0,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
