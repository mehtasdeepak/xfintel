import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      category,
      ticker_symbols,
      entry_price,
      current_price,
      target_price,
      tracker_status,
      price_captured_at,
      posted_at,
      x_post_id,
      influencers (
        x_handle,
        display_name,
        profile_image_url
      )
    `)
    .eq("category", "trade_call")
    .order("posted_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posts = (data ?? []).map(({ influencers, ticker_symbols, ...post }) => ({
    ...post,
    ticker: ticker_symbols?.[0] ?? null,
    influencer: Array.isArray(influencers)
      ? influencers[0] ?? null
      : influencers,
  }));

  return NextResponse.json({ posts });
}
