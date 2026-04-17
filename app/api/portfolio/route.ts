import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SIGNAL_CATEGORIES = ["portfolio", "trade_call", "watchlist", "position_update"];

// Known company names for common tickers
const COMPANY_NAMES: Record<string, string> = {
  NVDA: "NVIDIA", TSLA: "Tesla", AAPL: "Apple", MSFT: "Microsoft", GOOGL: "Alphabet",
  AMZN: "Amazon", META: "Meta", NFLX: "Netflix", AMD: "AMD", INTC: "Intel",
  PLTR: "Palantir", SOFI: "SoFi", MSTR: "MicroStrategy", COIN: "Coinbase",
  HOOD: "Robinhood", RBLX: "Roblox", SNAP: "Snap", UBER: "Uber", LYFT: "Lyft",
  SHOP: "Shopify", SQ: "Block", PYPL: "PayPal", TWLO: "Twilio", ZM: "Zoom",
  NET: "Cloudflare", DDOG: "Datadog", SNOW: "Snowflake", CRWD: "CrowdStrike",
  ABNB: "Airbnb", DASH: "DoorDash", RIVN: "Rivian", LCID: "Lucid", NIO: "NIO",
  XPEV: "XPeng", F: "Ford", GM: "GM", BABA: "Alibaba", JD: "JD.com",
  BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", DOGE: "Dogecoin", XRP: "XRP",
  SPY: "S&P 500 ETF", QQQ: "Nasdaq ETF", IWM: "Russell 2000 ETF",
  DIS: "Disney", NKLA: "Nikola", GME: "GameStop", AMC: "AMC",
  SMCI: "Super Micro", ARM: "Arm Holdings", AVGO: "Broadcom",
  TSM: "TSMC", QCOM: "Qualcomm", MU: "Micron",
};

async function fetchYahooPrice(ticker: string): Promise<{ price: number | null; change_pct: number | null }> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } }
    );
    if (!res.ok) return { price: null, change_pct: null };
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return { price: null, change_pct: null };
    const price: number = meta.regularMarketPrice ?? null;
    const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const change_pct = price != null && prev ? Math.round(((price - prev) / prev) * 10000) / 100 : null;
    return { price: price ? Math.round(price * 100) / 100 : null, change_pct };
  } catch {
    return { price: null, change_pct: null };
  }
}

export async function GET() {
  // ── Fetch all relevant posts ──────────────────────────────────────────────
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      category,
      sentiment,
      ticker_symbols,
      content,
      posted_at,
      x_post_id,
      influencers (
        id,
        x_handle,
        display_name,
        profile_image_url
      )
    `)
    .in("category", SIGNAL_CATEGORIES)
    .order("posted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allPosts = (posts ?? []).map(({ influencers, ...p }) => ({
    ...p,
    influencer: Array.isArray(influencers) ? influencers[0] ?? null : influencers,
  }));

  // ── Overall stats ─────────────────────────────────────────────────────────
  const { count: tradeCallCount } = await supabase
    .from("posts").select("*", { count: "exact", head: true }).eq("category", "trade_call");
  const { count: portfolioCount } = await supabase
    .from("posts").select("*", { count: "exact", head: true }).eq("category", "portfolio");
  const { count: positionUpdateCount } = await supabase
    .from("posts").select("*", { count: "exact", head: true }).eq("category", "position_update");
  const { count: exitCount } = await supabase
    .from("posts").select("*", { count: "exact", head: true }).eq("category", "exit");

  // ── Aggregate tickers ─────────────────────────────────────────────────────
  type InfluencerInfo = { x_handle: string; display_name: string; profile_image_url: string | null };

  const tickerMap = new Map<string, {
    mentions: number;
    influencerIds: Set<string>;
    influencers: Map<string, InfluencerInfo>;
    sentiments: string[];
    categories: Record<string, number>;
  }>();

  for (const post of allPosts) {
    const tickers: string[] = post.ticker_symbols ?? [];
    for (const ticker of tickers) {
      if (!tickerMap.has(ticker)) {
        tickerMap.set(ticker, {
          mentions: 0,
          influencerIds: new Set(),
          influencers: new Map(),
          sentiments: [],
          categories: {},
        });
      }
      const entry = tickerMap.get(ticker)!;
      entry.mentions++;
      entry.categories[post.category] = (entry.categories[post.category] ?? 0) + 1;
      if (post.sentiment) entry.sentiments.push(post.sentiment);
      if (post.influencer) {
        const id = post.influencer.x_handle;
        entry.influencerIds.add(id);
        if (!entry.influencers.has(id)) {
          entry.influencers.set(id, {
            x_handle: post.influencer.x_handle,
            display_name: post.influencer.display_name,
            profile_image_url: post.influencer.profile_image_url,
          });
        }
      }
    }
  }

  // ── Aggregate influencer holdings (strict ownership signals only) ─────────
  const HOLDING_CATEGORIES = new Set(["trade_call", "portfolio"]);

  // Phrases that indicate explicit ownership — tested case-insensitively
  const OWNERSHIP_PATTERNS = [
    /\bi\s+hold\b/i,
    /\bi'?m\s+holding\b/i,
    /\bholding\b/i,
    /\bi\s+bought\b/i,
    /\bi'?ve\s+bought\b/i,
    /\bbought\b/i,
    /\bi\s+added\b/i,
    /\badding\b/i,
    /\badded\s+to\b/i,
    /\bi\s+own\b/i,
    /\bi'?m\s+long\b/i,
    /\bentered\b/i,
    /\binitiated\s+a\s+position\b/i,
    /\bmy\s+position\b/i,
    /\bmy\s+portfolio\b/i,
    /\bi\s+have\b.*\bshares\b/i,
    /\baveraging\b/i,
  ];

  function hasOwnershipSignal(content: string): boolean {
    return OWNERSHIP_PATTERNS.some((re) => re.test(content));
  }

  const influencerMap = new Map<string, {
    display_name: string;
    x_handle: string;
    profile_image_url: string | null;
    tickers: Set<string>;
    sentiments: string[];
    latest_post_at: string;
  }>();

  for (const post of allPosts) {
    if (!HOLDING_CATEGORIES.has(post.category)) continue;
    if (!post.influencer) continue;
    if (!hasOwnershipSignal(post.content ?? "")) continue;
    const handle = post.influencer.x_handle;
    if (!influencerMap.has(handle)) {
      influencerMap.set(handle, {
        display_name: post.influencer.display_name,
        x_handle: handle,
        profile_image_url: post.influencer.profile_image_url,
        tickers: new Set(),
        sentiments: [],
        latest_post_at: post.posted_at,
      });
    }
    const entry = influencerMap.get(handle)!;
    for (const t of (post.ticker_symbols ?? [])) entry.tickers.add(t);
    if (post.sentiment) entry.sentiments.push(post.sentiment);
    if (post.posted_at > entry.latest_post_at) entry.latest_post_at = post.posted_at;
  }

  const influencerHoldings = [...influencerMap.values()]
    .filter((inf) => inf.tickers.size > 0)
    .sort((a, b) => b.tickers.size - a.tickers.size)
    .map((inf) => {
      const sentimentCounts: Record<string, number> = {};
      for (const s of inf.sentiments) sentimentCounts[s] = (sentimentCounts[s] ?? 0) + 1;
      const dominantSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";
      return {
        display_name: inf.display_name,
        x_handle: inf.x_handle,
        profile_image_url: inf.profile_image_url,
        tickers: [...inf.tickers],
        dominant_sentiment: dominantSentiment,
        latest_post_at: inf.latest_post_at,
      };
    });

  // Sort by unique influencer count desc, then mention count
  const sorted = [...tickerMap.entries()]
    .sort((a, b) => b[1].influencerIds.size - a[1].influencerIds.size || b[1].mentions - a[1].mentions)
    .slice(0, 20);

  // ── Fetch prices concurrently ─────────────────────────────────────────────
  const prices = await Promise.all(sorted.map(([ticker]) => fetchYahooPrice(ticker)));

  const tickers = sorted.map(([ticker, data], i) => {
    const sentimentCounts: Record<string, number> = {};
    for (const s of data.sentiments) sentimentCounts[s] = (sentimentCounts[s] ?? 0) + 1;
    const dominantSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";

    return {
      ticker,
      company_name: COMPANY_NAMES[ticker] ?? null,
      mentions: data.mentions,
      unique_influencers: data.influencerIds.size,
      dominant_sentiment: dominantSentiment,
      category_breakdown: data.categories,
      influencers: [...data.influencers.values()].slice(0, 6),
      price: prices[i].price,
      change_pct: prices[i].change_pct,
    };
  });

  // Most convicted = most unique influencers
  const mostConvicted = tickers[0] ?? null;

  // Consensus buys = trade_call posts from 3+ unique influencers
  const consensusBuys = tickers
    .filter((t) => {
      const tc = t.category_breakdown["trade_call"] ?? 0;
      return tc >= 1 && t.unique_influencers >= 3;
    })
    .slice(0, 5);

  // ── Recent exit posts ─────────────────────────────────────────────────────
  const { data: exitPosts } = await supabase
    .from("posts")
    .select(`
      id, content, category, sentiment, confidence, ticker_symbols, posted_at, x_post_id,
      influencers ( x_handle, display_name, profile_image_url )
    `)
    .eq("category", "exit")
    .order("posted_at", { ascending: false })
    .limit(3);

  const recentExits = (exitPosts ?? []).map(({ influencers, ...p }) => ({
    ...p,
    influencer: Array.isArray(influencers) ? influencers[0] ?? null : influencers,
  }));

  // ── Recent activity posts ─────────────────────────────────────────────────
  const { data: activityPosts } = await supabase
    .from("posts")
    .select(`
      id, content, category, sentiment, confidence, ticker_symbols, posted_at, x_post_id,
      influencers ( x_handle, display_name, profile_image_url )
    `)
    .in("category", ["trade_call", "portfolio", "position_update", "exit"])
    .order("posted_at", { ascending: false })
    .limit(20);

  const recentActivity = (activityPosts ?? []).map(({ influencers, ...p }) => ({
    ...p,
    influencer: Array.isArray(influencers) ? influencers[0] ?? null : influencers,
  }));

  return NextResponse.json(
    {
      stats: {
        trade_calls: tradeCallCount ?? 0,
        portfolio_posts: portfolioCount ?? 0,
        position_updates: positionUpdateCount ?? 0,
        exits: exitCount ?? 0,
      },
      tickers,
      most_convicted: mostConvicted,
      consensus_buys: consensusBuys,
      recent_exits: recentExits,
      recent_activity: recentActivity,
      influencer_holdings: influencerHoldings,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
