import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

export const maxDuration = 120;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CATEGORIZE_LIMIT = 30;
const POST_DELAY_MS = 300;

type ClaudeCategory =
  | "trade_call" | "position_update" | "exit" | "performance"
  | "portfolio" | "watchlist" | "analysis" | "noise";

type ClaudeResult = {
  category: ClaudeCategory;
  ticker: string | null;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  entry_price: number | null;
  target_price: number | null;
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
- entry_price: The stock price the influencer is buying/entering at. Look for phrases like "bought at $X", "entering at $X", "buying at $X", "added at $X". "PT $X" is NOT entry price. Return null if no explicit entry price is mentioned.
- target_price: The price target mentioned. Look for "PT $X", "target $X", "price target $X", "TP: $X", "target: $X", "$X target". Only meaningful for trade_call posts. Return null otherwise.

Post: ${content}

Respond with ONLY a valid JSON object in this exact format, nothing else:
{
  "category": "category_name",
  "ticker": "TICKER_OR_NULL",
  "sentiment": "bullish/bearish/neutral",
  "confidence": 0.00,
  "entry_price": null,
  "target_price": null
}`;
}

async function classifyPost(content: string, apiKey: string): Promise<ClaudeResult> {
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: buildPrompt(content) }],
    max_tokens: 250,
  });
  const raw = completion.choices[0].message.content ?? "";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned) as ClaudeResult;

  if ((parsed.category as string) === "news") parsed.category = "noise";
  if (!parsed.ticker || ["NULL", "TICKER_OR_NULL"].includes(parsed.ticker.toUpperCase())) {
    parsed.ticker = null;
  } else {
    parsed.ticker = parsed.ticker.toUpperCase();
  }
  parsed.entry_price = parsed.entry_price ?? null;
  parsed.target_price = parsed.target_price ?? null;

  return parsed;
}

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
  }

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
    .order("posted_at", { ascending: false })
    .limit(CATEGORIZE_LIMIT);

  if (fetchError) {
    return NextResponse.json({ error: `Supabase fetch error: ${fetchError.message}` }, { status: 500 });
  }
  if (!posts || posts.length === 0) {
    return NextResponse.json({
      ok: true,
      total_categorized: 0,
      category_breakdown: {},
      sentiment_breakdown: {},
      average_confidence: 0,
      failed_count: 0,
      time_ms: Date.now() - t0,
    });
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
        entry_price: result.entry_price ?? null,
        target_price: result.target_price ?? null,
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

  return NextResponse.json({
    ok: failedCount === 0,
    total_categorized: totalCategorized,
    category_breakdown: categoryBreakdown,
    sentiment_breakdown: sentimentBreakdown,
    average_confidence:
      totalCategorized > 0
        ? Math.round((confidenceSum / totalCategorized) * 1000) / 1000
        : 0,
    failed_count: failedCount,
    time_ms: Date.now() - t0,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
