import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ influencers: [], tickers: [] });

  const [{ data: influencers }, { data: tickers }] = await Promise.all([
    supabase
      .from("influencers")
      .select("id, x_handle, display_name")
      .eq("is_active", true)
      .or(`display_name.ilike.%${q}%,x_handle.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("posts")
      .select("ticker_symbols")
      .not("ticker_symbols", "is", null)
      .limit(200),
  ]);

  const tickerSet = new Set<string>();
  (tickers ?? []).forEach((p: any) => {
    (p.ticker_symbols ?? []).forEach((t: string) => {
      if (t.toLowerCase().includes(q.toLowerCase())) tickerSet.add(t.toUpperCase());
    });
  });

  return NextResponse.json({
    influencers: influencers ?? [],
    tickers: Array.from(tickerSet).slice(0, 5).map(t => ({ ticker: t })),
  });
}
