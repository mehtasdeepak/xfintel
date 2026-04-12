import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Returns signal_count and win_rate for an influencer identified by x_handle.
// Win rate = performance posts / trade_call posts this week (rough proxy).
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Look up influencer id
  const { data: inf, error: infErr } = await supabase
    .from("influencers")
    .select("id")
    .eq("x_handle", handle)
    .single();

  if (infErr || !inf) {
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }

  const { data: posts, error: postsErr } = await supabase
    .from("posts")
    .select("category")
    .eq("influencer_id", inf.id)
    .gte("posted_at", since)
    .in("category", ["trade_call", "performance"]);

  if (postsErr) {
    return NextResponse.json({ error: postsErr.message }, { status: 500 });
  }

  const tradeCalls = (posts ?? []).filter((p) => p.category === "trade_call").length;
  const performances = (posts ?? []).filter((p) => p.category === "performance").length;
  const winRate = tradeCalls > 0 ? Math.round((performances / tradeCalls) * 100) : null;

  return NextResponse.json({ signal_count: tradeCalls, win_rate: winRate });
}
