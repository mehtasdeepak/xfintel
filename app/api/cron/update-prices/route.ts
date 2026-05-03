import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  // Auth check
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Fetch all trade calls with entry_price set
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, ticker_symbols, entry_price, target_price, tracker_status")
    .eq("category", "trade_call")
    .not("entry_price", "is", null)
    .in("tracker_status", ["in_progress"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ updated: 0, message: "no posts to update" });
  }

  let updated = 0;
  let failed = 0;

  // Process each post
  await Promise.allSettled(
    posts.map(async (post) => {
      const ticker = post.ticker_symbols?.[0];
      if (!ticker) return;

      try {
        // Fetch current price from Yahoo Finance
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d&includePrePost=false`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!res.ok) throw new Error(`Yahoo returned ${res.status}`);

        const json = await res.json();
        const result = json?.chart?.result?.[0];
        const closes = result?.indicators?.quote?.[0]?.close;
        const currentPrice: number =
          result?.meta?.regularMarketPrice ??
          closes?.[closes.length - 1];

        if (!currentPrice) throw new Error("No price data");

        // Calculate new tracker_status
        const entry = post.entry_price as number;
        const target = post.target_price as number | null;

        let newStatus = "in_progress";
        if (target && currentPrice >= target) {
          newStatus = "hit_target";
        } else if (currentPrice < entry * 0.85) {
          newStatus = "invalidated";
        }

        // Update Supabase
        await supabase
          .from("posts")
          .update({
            current_price: currentPrice,
            tracker_status: newStatus,
          })
          .eq("id", post.id);

        updated++;
      } catch (e) {
        failed++;
      }
    })
  );

  return NextResponse.json({ updated, failed, total: posts.length });
}
