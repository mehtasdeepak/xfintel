import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("ticker_symbols, sentiment")
    .gte("posted_at", since)
    .neq("category", "noise");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Unnest ticker_symbols in JS and tally mentions + sentiment
  const tickerMap = new Map<
    string,
    { mentions: number; bullish: number; bearish: number }
  >();

  for (const post of posts ?? []) {
    for (const ticker of post.ticker_symbols ?? []) {
      if (!ticker) continue;
      if (!tickerMap.has(ticker)) {
        tickerMap.set(ticker, { mentions: 0, bullish: 0, bearish: 0 });
      }
      const entry = tickerMap.get(ticker)!;
      entry.mentions++;
      if (post.sentiment === "bullish") entry.bullish++;
      if (post.sentiment === "bearish") entry.bearish++;
    }
  }

  const top5 = Array.from(tickerMap.entries())
    .sort((a, b) => b[1].mentions - a[1].mentions)
    .slice(0, 5)
    .map(([ticker, stats]) => ({
      ticker,
      mentions: stats.mentions,
      sentiment:
        stats.bullish > stats.bearish
          ? "bullish"
          : stats.bearish > stats.bullish
          ? "bearish"
          : "neutral",
    }));

  return NextResponse.json({ tickers: top5 });
}
