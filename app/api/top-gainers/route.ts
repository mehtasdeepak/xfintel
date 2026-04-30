import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  // Step 1: fetch ticker mentions from last 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("ticker_symbols")
    .gte("posted_at", since)
    .not("ticker_symbols", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count mentions per ticker
  const mentionCount: Record<string, number> = {};
  for (const post of posts ?? []) {
    for (const ticker of post.ticker_symbols ?? []) {
      mentionCount[ticker] = (mentionCount[ticker] ?? 0) + 1;
    }
  }

  // Top 20 by mention count
  const top20 = Object.entries(mentionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([ticker, mentions]) => ({ ticker, mentions }));

  if (top20.length === 0) {
    return NextResponse.json({ gainers: [] });
  }

  // Step 2: fetch Yahoo Finance price data in parallel
  const results = await Promise.allSettled(
    top20.map(async ({ ticker, mentions }) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d&includePrePost=false`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 300 },
      });

      if (!res.ok) throw new Error(`Yahoo returned ${res.status} for ${ticker}`);

      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) throw new Error(`No result for ${ticker}`);

      const meta = result.meta;
      const closes = result.timestamp ? result.indicators?.quote?.[0]?.close : null;

      const price: number =
        meta?.regularMarketPrice ??
        meta?.chartPreviousClose ??
        closes?.[closes.length - 1];

      const changePercent: number =
        meta?.regularMarketChangePercent ??
        (closes && closes.length >= 2
          ? ((closes[closes.length-1] - closes[closes.length-2]) / closes[closes.length-2]) * 100
          : null);

      const change: number =
        meta?.regularMarketChange ??
        (closes && closes.length >= 2
          ? closes[closes.length-1] - closes[closes.length-2]
          : 0);

      if (!price || changePercent == null) throw new Error(`Missing price data for ${ticker}`);

      return { ticker, price, change, changePercent, mentions };
    })
  );

  // Step 3: keep only fulfilled, positive change, sort descending, top 10
  const gainers = results
    .filter(
      (r): r is PromiseFulfilledResult<{
        ticker: string; price: number; change: number;
        changePercent: number; mentions: number;
      }> => r.status === "fulfilled" && r.value.changePercent > 0
    )
    .map((r) => r.value)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);

  return NextResponse.json({ gainers });
}
