import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const xHandle = handle.startsWith("@") ? handle : `@${handle}`;

  // Fetch influencer
  const { data: influencer, error: infErr } = await supabase
    .from("influencers")
    .select("id, x_handle, display_name, profile_image_url, follower_count")
    .eq("x_handle", xHandle)
    .single();

  if (infErr || !influencer) {
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }

  // Fetch all posts ordered newest first
  const { data: posts, error: postsErr } = await supabase
    .from("posts")
    .select("id, content, category, sentiment, confidence, ticker_symbols, posted_at, x_post_id")
    .eq("influencer_id", influencer.id)
    .order("posted_at", { ascending: false });

  if (postsErr) {
    return NextResponse.json({ error: postsErr.message }, { status: 500 });
  }

  const allPosts = posts ?? [];

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total_posts = allPosts.length;
  const trade_calls = allPosts.filter((p) => p.category === "trade_call").length;
  const performance_posts = allPosts.filter((p) => p.category === "performance").length;
  const exits = allPosts.filter((p) => p.category === "exit").length;
  const bullish_performances = allPosts.filter(
    (p) => p.category === "performance" && p.sentiment === "bullish"
  ).length;
  const win_rate =
    performance_posts > 0
      ? Math.round((bullish_performances / performance_posts) * 100)
      : null;
  const transparency_score = allPosts.some(
    (p) => p.category === "exit" || p.category === "performance"
  );

  // ── Most mentioned tickers (top 5) ────────────────────────────────────────

  const tickerMap = new Map<string, number>();
  for (const post of allPosts) {
    for (const ticker of post.ticker_symbols ?? []) {
      if (ticker) tickerMap.set(ticker, (tickerMap.get(ticker) ?? 0) + 1);
    }
  }
  const most_mentioned_tickers = Array.from(tickerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ticker, count]) => ({ ticker, count }));

  // ── Holdings (explicit ownership language only) ───────────────────────────

  const OWNERSHIP_RE = /\b(hold|holding|bought|added|own|long|position|averaging)\b/i;
  const HOLDING_CATS = new Set(["portfolio", "trade_call"]);

  const holdingsMap = new Map<string, number>();
  for (const post of allPosts) {
    if (!HOLDING_CATS.has(post.category)) continue;
    if (!OWNERSHIP_RE.test(post.content ?? "")) continue;
    for (const ticker of post.ticker_symbols ?? []) {
      if (ticker) holdingsMap.set(ticker, (holdingsMap.get(ticker) ?? 0) + 1);
    }
  }
  const holdings = Array.from(holdingsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ticker, count]) => ({ ticker, count }));

  // ── Category breakdown ────────────────────────────────────────────────────

  const catMap = new Map<string, number>();
  for (const post of allPosts) {
    if (post.category && post.category !== "noise") {
      catMap.set(post.category, (catMap.get(post.category) ?? 0) + 1);
    }
  }
  const nonNoise = allPosts.filter((p) => p.category !== "noise").length;
  const category_breakdown = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      pct: nonNoise > 0 ? Math.round((count / nonNoise) * 100) : 0,
    }));

  // ── Most active time of day (UTC hours) ───────────────────────────────────

  const buckets = { morning: 0, afternoon: 0, evening: 0 };
  for (const post of allPosts) {
    const hour = new Date(post.posted_at).getUTCHours();
    if (hour >= 6 && hour < 12) buckets.morning++;
    else if (hour >= 12 && hour < 18) buckets.afternoon++;
    else buckets.evening++;
  }
  const most_active_time = (
    Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0]
  ) as "morning" | "afternoon" | "evening";

  return NextResponse.json({
    influencer,
    stats: {
      total_posts,
      trade_calls,
      performance_posts,
      exits,
      win_rate,
      transparency_score,
      most_mentioned_tickers,
      category_breakdown,
      most_active_time,
    },
    holdings,
    posts: allPosts,
  });
}
