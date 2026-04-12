import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type PostRow = {
  influencer_id: string;
  category: string;
  sentiment: string | null;
};

type InfluencerRow = {
  id: string;
  x_handle: string;
  display_name: string;
  profile_image_url: string | null;
  follower_count: number | null;
};

function dominant(counts: Record<string, number>): string | null {
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

export async function GET(req: NextRequest) {
  const daysParam = req.nextUrl.searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 0;

  // 1. Fetch active influencers
  const { data: influencers, error: infErr } = await supabase
    .from("influencers")
    .select("id, x_handle, display_name, profile_image_url, follower_count")
    .eq("is_active", true);

  if (infErr) {
    return NextResponse.json({ error: infErr.message }, { status: 500 });
  }

  // 2. Fetch posts in timeframe
  let postsQuery = supabase
    .from("posts")
    .select("influencer_id, category, sentiment");

  if (days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    postsQuery = postsQuery.gte("posted_at", since);
  }

  const { data: posts, error: postsErr } = await postsQuery;

  if (postsErr) {
    return NextResponse.json({ error: postsErr.message }, { status: 500 });
  }

  // 3. Aggregate stats per influencer
  const statsMap = new Map<
    string,
    {
      total_signals: number;
      trade_calls: number;
      performance_posts: number;
      bullish_performances: number;
      has_transparency: boolean;
      sentiment_counts: Record<string, number>;
    }
  >();

  for (const inf of influencers as InfluencerRow[]) {
    statsMap.set(inf.id, {
      total_signals: 0,
      trade_calls: 0,
      performance_posts: 0,
      bullish_performances: 0,
      has_transparency: false,
      sentiment_counts: { bullish: 0, bearish: 0, neutral: 0 },
    });
  }

  for (const post of posts as PostRow[]) {
    const stats = statsMap.get(post.influencer_id);
    if (!stats) continue;

    if (post.category === "noise") continue;
    stats.total_signals++;

    if (post.category === "trade_call") stats.trade_calls++;
    if (post.category === "performance") {
      stats.performance_posts++;
      if (post.sentiment === "bullish") stats.bullish_performances++;
    }
    if (post.category === "exit" || post.category === "performance") {
      stats.has_transparency = true;
    }
    if (post.sentiment && post.sentiment in stats.sentiment_counts) {
      stats.sentiment_counts[post.sentiment]++;
    }
  }

  // 4. Build ranked response
  const ranked = (influencers as InfluencerRow[])
    .map((inf) => {
      const s = statsMap.get(inf.id)!;
      const win_rate =
        s.performance_posts > 0
          ? Math.round((s.bullish_performances / s.performance_posts) * 100)
          : null;

      return {
        id: inf.id,
        x_handle: inf.x_handle,
        display_name: inf.display_name,
        profile_image_url: inf.profile_image_url,
        follower_count: inf.follower_count,
        total_signals: s.total_signals,
        trade_calls: s.trade_calls,
        performance_posts: s.performance_posts,
        win_rate,
        transparency_score: s.has_transparency,
        dominant_sentiment: dominant(s.sentiment_counts),
      };
    })
    .sort((a, b) => b.total_signals - a.total_signals);

  // 5. Summary stats (always based on last 7 days regardless of timeframe)
  const weekSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: weekSignals } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .neq("category", "noise")
    .gte("posted_at", weekSince);

  const mostActive = ranked[0]?.display_name ?? null;

  return NextResponse.json({
    influencers: ranked,
    summary: {
      total_influencers: ranked.length,
      total_signals_week: weekSignals ?? 0,
      most_active: mostActive,
    },
  });
}
