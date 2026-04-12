import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Prerequisites — run in Supabase SQL editor before using this route:
//   alter table posts add column if not exists sentiment text check (sentiment in ('bullish', 'bearish', 'neutral'));
//   alter table posts add column if not exists confidence numeric(3,2);
// Also add ANTHROPIC_API_KEY to .env.local

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const POST_DELAY_MS = 300;

type PostRow = {
  id: string;
  content: string;
  ticker_symbols: string[];
};

type ClaudeCategory =
  | "trade_call"
  | "position_update"
  | "exit"
  | "performance"
  | "portfolio"
  | "watchlist"
  | "analysis"
  | "noise";

type ClaudeResult = {
  category: ClaudeCategory;
  ticker: string | null;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
};

function buildPrompt(content: string): string {
  return `You are a financial social media post categorizer for a platform that tracks financial influencers on X (Twitter).

Categorize this post into exactly one category:
- trade_call: Direct recommendation to buy/long or sell/short a specific asset
- position_update: Modifying an existing position (moving stops, adding more, scaling in/out)
- exit: Full or partial closure of a position
- performance: Reporting a PnL result, gain or loss on a closed or active trade
- portfolio: Current holdings snapshot or portfolio allocation
- watchlist: Expressing interest in an asset without executing (e.g. 'watching $NVDA for a breakout')
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

async function classifyPost(
  content: string,
  apiKey: string
): Promise<{ result: ClaudeResult; rawResponse: string }> {
  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 150,
      messages: [{ role: "user", content: buildPrompt(content) }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errorText}`);
  }

  const body = await res.json();
  const rawResponse: string = body.content?.[0]?.text ?? "";

  // Strip markdown code fences if present
  const cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned) as ClaudeResult;

  // Normalise category: Claude occasionally returns 'news', map it to 'noise'
  if ((parsed.category as string) === "news") {
    parsed.category = "noise";
  }

  // Normalise ticker: "TICKER_OR_NULL" literal → null
  if (
    !parsed.ticker ||
    parsed.ticker.toUpperCase() === "TICKER_OR_NULL" ||
    parsed.ticker.toUpperCase() === "NULL"
  ) {
    parsed.ticker = null;
  } else {
    parsed.ticker = parsed.ticker.toUpperCase();
  }

  return { result: parsed, rawResponse };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : null;

  if (limit !== null && (isNaN(limit) || limit < 1)) {
    return NextResponse.json(
      { error: "limit must be a positive integer" },
      { status: 400 }
    );
  }

  // 1. Fetch posts where category = 'noise' (uncategorized)
  let query = supabase
    .from("posts")
    .select("id, content, ticker_symbols")
    .eq("category", "noise");

  if (limit !== null) query = query.limit(limit);

  const { data: posts, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!posts || posts.length === 0) {
    return NextResponse.json({
      total_categorized: 0,
      category_breakdown: {},
      sentiment_breakdown: {},
      average_confidence: 0,
    });
  }

  // 2. Process posts sequentially, one at a time with a delay between each
  const categoryBreakdown: Record<string, number> = {};
  const sentimentBreakdown: Record<string, number> = {};
  const failed: { post_id: string; content: string; raw_response: string; error: string }[] = [];
  let totalCategorized = 0;
  let confidenceSum = 0;

  for (let i = 0; i < posts.length; i++) {
    if (i > 0) await sleep(POST_DELAY_MS);

    const post = (posts as PostRow[])[i];
    let rawResponse = "";
    let result: ClaudeResult;

    try {
      ({ result, rawResponse } = await classifyPost(post.content, apiKey));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[categorize-posts] Classification failed", {
        post_content: post.content,
        raw_response: rawResponse,
        error: message,
      });
      failed.push({
        post_id: post.id,
        content: post.content,
        raw_response: rawResponse,
        error: message,
      });
      continue;
    }

    // Merge ticker into existing ticker_symbols array
    const existingTickers: string[] = post.ticker_symbols ?? [];
    const mergedTickers =
      result.ticker && !existingTickers.includes(result.ticker)
        ? [...existingTickers, result.ticker]
        : existingTickers;

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
      console.error("[categorize-posts] Supabase update failed", {
        post_content: post.content,
        raw_response: rawResponse,
        error: updateError.message,
      });
      failed.push({
        post_id: post.id,
        content: post.content,
        raw_response: rawResponse,
        error: `Supabase update failed: ${updateError.message}`,
      });
      continue;
    }

    totalCategorized++;
    confidenceSum += result.confidence;
    categoryBreakdown[result.category] =
      (categoryBreakdown[result.category] ?? 0) + 1;
    sentimentBreakdown[result.sentiment] =
      (sentimentBreakdown[result.sentiment] ?? 0) + 1;
  }

  return NextResponse.json({
    total_categorized: totalCategorized,
    category_breakdown: categoryBreakdown,
    sentiment_breakdown: sentimentBreakdown,
    average_confidence:
      totalCategorized > 0
        ? Math.round((confidenceSum / totalCategorized) * 1000) / 1000
        : 0,
    failed_count: failed.length,
    failed,
  });
}
