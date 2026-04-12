import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEFAULT_LIMIT = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const category = searchParams.get("category") ?? null;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  let query = supabase
    .from("posts")
    .select(`
      id,
      content,
      category,
      sentiment,
      confidence,
      ticker_symbols,
      posted_at,
      x_post_id,
      influencers (
        x_handle,
        display_name,
        profile_image_url
      )
    `)
    .order("posted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  } else {
    // Exclude noise from the default feed
    query = query.neq("category", "noise");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reshape: rename nested `influencers` object to `influencer` (singular)
  const posts = (data ?? []).map(({ influencers, ...post }) => ({
    ...post,
    influencer: Array.isArray(influencers) ? influencers[0] ?? null : influencers,
  }));

  return NextResponse.json({
    posts,
    has_more: posts.length === limit,
  });
}
