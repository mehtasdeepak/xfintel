import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("ticker_symbols, sentiment, confidence, influencer_id")
    .gte("posted_at", since)
    .neq("category", "noise");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type TickerStats = {
    mentions: number;
    bullish: number;
    bearish: number;
    neutral: number;
    influencers: Set<string>;
    confidence_sum: number;
    confidence_count: number;
  };

  const map = new Map<string, TickerStats>();

  for (const post of posts ?? []) {
    for (const ticker of post.ticker_symbols ?? []) {
      if (!ticker) continue;
      if (!map.has(ticker)) {
        map.set(ticker, {
          mentions: 0,
          bullish: 0,
          bearish: 0,
          neutral: 0,
          influencers: new Set(),
          confidence_sum: 0,
          confidence_count: 0,
        });
      }
      const s = map.get(ticker)!;
      s.mentions++;
      if (post.sentiment === "bullish") s.bullish++;
      else if (post.sentiment === "bearish") s.bearish++;
      else s.neutral++;
      if (post.influencer_id) s.influencers.add(post.influencer_id);
      if (post.confidence != null) {
        s.confidence_sum += post.confidence;
        s.confidence_count++;
      }
    }
  }

  const ranked = Array.from(map.entries())
    .sort((a, b) => b[1].mentions - a[1].mentions)
    .slice(0, 20)
    .map(([ticker, s]) => {
      const dominant =
        s.bullish >= s.bearish && s.bullish >= s.neutral
          ? "bullish"
          : s.bearish >= s.neutral
          ? "bearish"
          : "neutral";

      return {
        ticker,
        mentions: s.mentions,
        dominant_sentiment: dominant,
        bullish_count: s.bullish,
        bearish_count: s.bearish,
        neutral_count: s.neutral,
        influencer_count: s.influencers.size,
        avg_confidence:
          s.confidence_count > 0
            ? Math.round((s.confidence_sum / s.confidence_count) * 100)
            : null,
      };
    });

  // Fetch Yahoo Finance prices for all tickers in parallel; failures return nulls
  async function fetchPrice(
    ticker: string
  ): Promise<{ price: number | null; price_change_percent: number | null }> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return { price: null, price_change_percent: null };
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      const price: number | null = meta?.regularMarketPrice ?? null;
      const pct: number | null = meta?.regularMarketChangePercent ?? null;
      return {
        price: price != null ? Math.round(price * 100) / 100 : null,
        price_change_percent: pct != null ? Math.round(pct * 100) / 100 : null,
      };
    } catch {
      return { price: null, price_change_percent: null };
    }
  }

  const prices = await Promise.all(ranked.map((t) => fetchPrice(t.ticker)));
  const tickers = ranked.map((t, i) => ({ ...t, ...prices[i] }));

  return NextResponse.json({ tickers });
}
