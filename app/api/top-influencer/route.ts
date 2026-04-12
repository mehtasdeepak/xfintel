import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("influencer_id, influencers(x_handle, display_name, profile_image_url)")
    .eq("category", "trade_call")
    .gte("posted_at", since);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ influencer: null });
  }

  // Count trade_calls per influencer
  const countMap = new Map<
    string,
    { count: number; influencer: Record<string, unknown> }
  >();

  for (const post of posts) {
    const id = post.influencer_id;
    if (!countMap.has(id)) {
      const inf = Array.isArray(post.influencers)
        ? post.influencers[0]
        : post.influencers;
      countMap.set(id, { count: 0, influencer: inf as Record<string, unknown> });
    }
    countMap.get(id)!.count++;
  }

  const top = Array.from(countMap.values()).sort((a, b) => b.count - a.count)[0];

  return NextResponse.json({
    influencer: {
      ...(top.influencer ?? {}),
      signal_count: top.count,
    },
  });
}
