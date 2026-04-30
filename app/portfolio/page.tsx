"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import PostCard, { type Post } from "@/components/PostCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type TradeTracker = {
  id: string;
  ticker: string | null;
  entry_price: number | null;
  current_price: number | null;
  target_price: number | null;
  tracker_status: string | null;
  posted_at: string;
  content: string;
  x_post_id: string;
  influencer: {
    display_name: string;
    x_handle: string;
    profile_image_url: string | null;
  } | null;
};

type InfluencerAvatar = {
  x_handle: string;
  display_name: string;
  profile_image_url: string | null;
};

type TickerData = {
  ticker: string;
  company_name: string | null;
  mentions: number;
  unique_influencers: number;
  dominant_sentiment: string;
  category_breakdown: Record<string, number>;
  influencers: InfluencerAvatar[];
  price: number | null;
  change_pct: number | null;
};

type InfluencerHolding = {
  display_name: string;
  x_handle: string;
  profile_image_url: string | null;
  tickers: string[];
  dominant_sentiment: string;
  latest_post_at: string;
};

type PortfolioData = {
  stats: {
    trade_calls: number;
    portfolio_posts: number;
    position_updates: number;
    exits: number;
  };
  tickers: TickerData[];
  most_convicted: TickerData | null;
  consensus_buys: TickerData[];
  recent_exits: Post[];
  recent_activity: Post[];
  influencer_holdings: InfluencerHolding[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_COLOR: Record<string, { bg: string; text: string; bar: string }> = {
  bullish: { bg: "#e8f5e8", text: "var(--teal)", bar: "var(--teal)" },
  bearish: { bg: "#fef2f2", text: "var(--down)", bar: "var(--down)" },
  neutral: { bg: "#f5f5f5", text: "var(--ink-2)", bar: "var(--muted)" },
};

const CATEGORY_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  trade_call:      { bg: "var(--teal)", text: "#ffffff", label: "Trade Call" },
  portfolio:       { bg: "#0891b2", text: "#ffffff", label: "Portfolio" },
  watchlist:       { bg: "#d97706", text: "#ffffff", label: "Watchlist" },
  position_update: { bg: "#1a56db", text: "#ffffff", label: "Update" },
};

function Avatar({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="rounded-full object-cover border-2 border-white flex-shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center border-2 border-white flex-shrink-0 text-xs font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: "var(--teal)", fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl p-4 md:p-5 flex flex-col gap-1"
      style={{ backgroundColor: "var(--card)", boxShadow: "0px 4px 16px rgba(23, 29, 27, 0.06)" }}
    >
      <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--teal)" }}>
        {value}
      </p>
      <p className="text-xs md:text-sm" style={{ color: "var(--ink-2)" }}>
        {label}
      </p>
    </div>
  );
}

function TickerCard({ t }: { t: TickerData }) {
  const sentiment = SENTIMENT_COLOR[t.dominant_sentiment] ?? SENTIMENT_COLOR.neutral;
  const priceUp = t.change_pct != null && t.change_pct >= 0;

  return (
    <div
      className="rounded-2xl p-4 md:p-5 flex flex-col gap-3"
      style={{ backgroundColor: "var(--card)", boxShadow: "0px 4px 16px rgba(23, 29, 27, 0.06)" }}
    >
      {/* Top row: ticker pill + price */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-base font-bold px-3 py-1 rounded-full inline-block"
            style={{ backgroundColor: "var(--ink)", color: "#ffffff" }}
          >
            ${t.ticker}
          </span>
          {t.company_name && (
            <p className="text-xs pl-1 mt-1" style={{ color: "var(--ink-2)" }}>
              {t.company_name}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {t.price != null ? (
            <>
              <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                ${t.price.toLocaleString()}
              </p>
              <p
                className="text-xs font-medium"
                style={{ color: priceUp ? "var(--teal)" : "var(--down)" }}
              >
                {priceUp ? "+" : ""}{t.change_pct}%
              </p>
            </>
          ) : (
            <p className="text-xs" style={{ color: "var(--muted)" }}>No price</p>
          )}
        </div>
      </div>

      {/* Influencer count */}
      <p className="text-xs" style={{ color: "var(--ink-2)" }}>
        <span className="font-semibold" style={{ color: "var(--ink)" }}>{t.unique_influencers}</span>{" "}
        influencer{t.unique_influencers !== 1 ? "s" : ""} tracking ·{" "}
        {t.mentions} mention{t.mentions !== 1 ? "s" : ""}
      </p>

      {/* Sentiment bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--line)" }}>
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${Math.min(100, (t.unique_influencers / 10) * 100)}%`,
              backgroundColor: sentiment.bar,
            }}
          />
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0"
          style={{ backgroundColor: sentiment.bg, color: sentiment.text }}
        >
          {t.dominant_sentiment}
        </span>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(t.category_breakdown).map(([cat, count]) => {
          const cfg = CATEGORY_COLOR[cat];
          if (!cfg) return null;
          return (
            <span
              key={cat}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.bg, color: cfg.text }}
            >
              {count} {cfg.label}
            </span>
          );
        })}
      </div>

      {/* Stacked avatars */}
      {t.influencers.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex" style={{ gap: -6 }}>
            {t.influencers.slice(0, 4).map((inf, i) => (
              <div key={inf.x_handle} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i, position: "relative" }}>
                <Avatar src={inf.profile_image_url} name={inf.display_name} size={26} />
              </div>
            ))}
          </div>
          {t.influencers.length > 4 && (
            <p className="text-xs" style={{ color: "var(--ink-2)" }}>
              +{t.influencers.length - 4} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfluencerHoldingRow({ inf }: { inf: InfluencerHolding }) {
  const handle = inf.x_handle.replace(/^@/, "");
  const initials = inf.display_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const shown = inf.tickers.slice(0, 6);
  const overflow = inf.tickers.length - shown.length;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
      style={{ backgroundColor: "var(--card)", boxShadow: "0px 4px 16px rgba(23, 29, 27, 0.06)" }}
    >
      {/* Left: avatar + name */}
      <div className="flex items-center gap-3 flex-shrink-0 min-w-0 sm:w-48">
        {inf.profile_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={inf.profile_image_url}
            alt={inf.display_name}
            className="rounded-full object-cover flex-shrink-0"
            style={{ width: 48, height: 48 }}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white"
            style={{ width: 48, height: 48, backgroundColor: "var(--teal)" }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
            {inf.display_name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--ink-2)" }}>
            @{handle}
          </p>
        </div>
      </div>

      {/* Middle: ticker pills */}
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        {shown.map((ticker) => (
          <span
            key={ticker}
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: "#dcfce7", color: "var(--teal)" }}
          >
            ${ticker}
          </span>
        ))}
        {overflow > 0 && (
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--line)", color: "var(--ink-2)" }}
          >
            +{overflow} more
          </span>
        )}
      </div>

      {/* Right: view profile link */}
      <a
        href={`/influencer/${handle}`}
        className="text-xs font-medium flex-shrink-0 whitespace-nowrap transition-colors"
        style={{ color: "var(--teal)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--teal-2)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--teal)")}
      >
        View Profile →
      </a>
    </div>
  );
}

function RightSidebar({
  mostConvicted,
  consensusBuys,
  recentExits,
  loading,
}: {
  mostConvicted: TickerData | null;
  consensusBuys: TickerData[];
  recentExits: Post[];
  loading: boolean;
}) {
  const Skeleton = () => (
    <div className="h-4 rounded animate-pulse w-3/4" style={{ backgroundColor: "var(--line)" }} />
  );

  return (
    <aside className="flex flex-col gap-4">
      {/* Most Convicted */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ backgroundColor: "var(--card)", boxShadow: "0px 4px 16px rgba(23, 29, 27, 0.06)" }}
      >
        <p className="type-label" style={{ color: "var(--ink-2)" }}>Most Convicted</p>
        {loading ? (
          <Skeleton />
        ) : mostConvicted ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                className="text-lg font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: "var(--ink)", color: "#ffffff" }}
              >
                ${mostConvicted.ticker}
              </span>
              {mostConvicted.change_pct != null && (
                <span
                  className="text-sm font-semibold"
                  style={{ color: mostConvicted.change_pct >= 0 ? "var(--teal)" : "var(--down)" }}
                >
                  {mostConvicted.change_pct >= 0 ? "+" : ""}{mostConvicted.change_pct}%
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--ink-2)" }}>
              <span className="font-semibold" style={{ color: "var(--ink)" }}>
                {mostConvicted.unique_influencers}
              </span>{" "}
              influencers · {mostConvicted.mentions} mentions
            </p>
            <div className="flex">
              {mostConvicted.influencers.slice(0, 5).map((inf, i) => (
                <div key={inf.x_handle} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i, position: "relative" }}>
                  <Avatar src={inf.profile_image_url} name={inf.display_name} size={28} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>No data yet.</p>
        )}
      </div>

      {/* Consensus Buys */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ backgroundColor: "var(--card)", boxShadow: "0px 4px 16px rgba(23, 29, 27, 0.06)" }}
      >
        <p className="type-label" style={{ color: "var(--ink-2)" }}>Consensus Buys</p>
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>3+ influencers with trade calls</p>
        {loading ? (
          <div className="flex flex-col gap-2"><Skeleton /><Skeleton /></div>
        ) : consensusBuys.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>No consensus yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {consensusBuys.map((t) => (
              <div key={t.ticker} className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "#e8f5e8", color: "var(--teal)" }}
                >
                  ${t.ticker}
                </span>
                <span className="text-xs" style={{ color: "var(--ink-2)" }}>
                  {t.unique_influencers} tracking
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Exits */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ backgroundColor: "var(--card)", boxShadow: "0px 4px 16px rgba(23, 29, 27, 0.06)" }}
      >
        <p className="type-label" style={{ color: "var(--ink-2)" }}>Recent Exits</p>
        {loading ? (
          <div className="flex flex-col gap-2"><Skeleton /><Skeleton /></div>
        ) : recentExits.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>No exits yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentExits.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-1 pb-3"
                style={{ borderBottom: "1px solid var(--teal-soft)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
                    {post.influencer?.display_name ?? "Unknown"}
                  </p>
                  {post.ticker_symbols?.[0] && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
                    >
                      ${post.ticker_symbols[0]}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs line-clamp-2 leading-relaxed"
                  style={{ color: "var(--ink-2)" }}
                >
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackerPosts, setTrackerPosts] = useState<TradeTracker[]>([]);
  const [trackerTab, setTrackerTab] = useState<string>("in_progress");
  const [trackerLoading, setTrackerLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed: ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    fetch("/api/trade-tracker")
      .then((r) => r.json())
      .then((d) => setTrackerPosts(d.posts ?? []))
      .finally(() => setTrackerLoading(false));
  }, []);

  const stats = data?.stats;
  const tickers = data?.tickers ?? [];
  const influencerHoldings = data?.influencer_holdings ?? [];
  const recentActivity = data?.recent_activity ?? [];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-2)" }}>
      <Sidebar />
      <TopNav />

      <main className="flex-1 md:ml-[220px]" style={{ paddingTop: 56, minWidth: 0 }}>
        <div className="px-4 md:px-6 py-6 md:py-8 max-w-[1200px] mx-auto">

          {/* Page header */}
          <div className="mb-6 md:mb-8 flex flex-col gap-1">
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "var(--teal)",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              fontWeight: 500,
              marginBottom: 8,
            }}>Your Portfolio</p>
            <h1 style={{ fontSize: "34px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", margin: "0 0 8px" }}>
              What Fin X Is Buying, Holding &amp; Watching
            </h1>
            <p style={{ fontSize: "14px", color: "var(--ink-2)", lineHeight: 1.55 }}>
              Explicit positions and moves from 35 tracked financial influencers on X
            </p>
          </div>

          {/* Performance Tracker */}
          <div style={{marginBottom:40}}>

            {/* Section header */}
            <div style={{marginBottom:16}}>
              <p style={{fontFamily:"'JetBrains Mono',monospace",
                fontSize:"11px",color:"var(--teal)",
                letterSpacing:"0.12em",textTransform:"uppercase" as const,
                fontWeight:500,marginBottom:4}}>
                AI Signal Tracker
              </p>
              <h2 style={{fontSize:"22px",fontWeight:600,
                color:"var(--ink)",letterSpacing:"-0.02em",
                margin:"0 0 4px"}}>
                Trade Call Performance
              </h2>
              <p style={{fontSize:"14px",color:"var(--ink-2)",margin:0}}>
                Tracking price movement on trade calls from FinX leaders
              </p>
            </div>

            {/* Status tabs */}
            <div style={{display:"flex",borderBottom:"1px solid var(--line)",marginBottom:0}}>
              {[
                {label:"In Progress", value:"in_progress"},
                {label:"Hit Target",  value:"hit_target"},
                {label:"Invalidated", value:"invalidated"},
                {label:"No Target",   value:"no_target"},
              ].map(tab => {
                const count = trackerPosts.filter(p =>
                  (p.tracker_status ?? "no_target") === tab.value).length;
                const isActive = trackerTab === tab.value;
                return (
                  <button key={tab.value}
                    onClick={() => setTrackerTab(tab.value)}
                    style={{padding:"10px 16px",border:"none",
                      borderBottom: isActive
                        ? "2px solid var(--teal)"
                        : "2px solid transparent",
                      backgroundColor:"transparent",cursor:"pointer",
                      fontSize:"13px",fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--teal)" : "var(--muted)",
                      marginBottom:-1,whiteSpace:"nowrap"}}>
                    {tab.label}
                    <span style={{marginLeft:6,fontSize:"11px",
                      fontFamily:"'JetBrains Mono',monospace",
                      opacity:0.7}}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div style={{backgroundColor:"var(--card)",
              border:"1px solid var(--line)",
              borderTop:"none",borderRadius:"0 0 14px 14px",
              overflow:"hidden"}}>

              {/* Table header */}
              <div style={{display:"grid",
                gridTemplateColumns:"90px 170px 90px 90px 90px 80px 140px 100px",
                padding:"10px 16px",
                backgroundColor:"var(--bg-2)",
                borderBottom:"1px solid var(--line)"}}>
                {["DATE","INFLUENCER","TICKER","ENTRY","NOW","MOVE","PROGRESS","STATUS"].map(col => (
                  <span key={col} style={{
                    fontFamily:"'JetBrains Mono',monospace",
                    fontSize:"10px",letterSpacing:"0.1em",
                    color:"var(--muted)",fontWeight:500}}>
                    {col}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {trackerLoading ? (
                <div style={{padding:"32px 16px",textAlign:"center",
                  color:"var(--muted)",fontSize:"13px"}}>
                  Loading...
                </div>
              ) : trackerPosts.filter(p =>
                  (p.tracker_status ?? "no_target") === trackerTab
                ).length === 0 ? (
                <div style={{padding:"40px 16px",textAlign:"center",
                  color:"var(--muted)",fontSize:"14px"}}>
                  No {trackerTab.replace(/_/g," ")} trade calls yet.
                </div>
              ) : (
                trackerPosts
                  .filter(p => (p.tracker_status ?? "no_target") === trackerTab)
                  .map((post, idx, arr) => {
                    const handle = post.influencer?.x_handle ?? "";
                    const username = handle.replace(/^@/, "");
                    const tweetUrl = `https://x.com/${username}/status/${post.x_post_id}`;
                    const initials = (post.influencer?.display_name ?? "?")
                      .split(" ").map((w: string) => w[0])
                      .slice(0, 2).join("").toUpperCase();
                    const GRAD = [
                      "linear-gradient(135deg,#fbbf24,#d97706)",
                      "linear-gradient(135deg,#60a5fa,#2563eb)",
                      "linear-gradient(135deg,#34d399,#059669)",
                      "linear-gradient(135deg,#f472b6,#be185d)",
                      "linear-gradient(135deg,#a78bfa,#6d28d9)",
                      "linear-gradient(135deg,#fb923c,#c2410c)",
                    ];
                    const grad = GRAD[(initials.charCodeAt(0) ?? 0) % 6];
                    const entry = post.entry_price;
                    const current = post.current_price;
                    const target = post.target_price;
                    const move = entry && current
                      ? ((current - entry) / entry * 100) : null;
                    const progress = entry && target && current && target !== entry
                      ? Math.min(100, Math.max(0,
                          ((current - entry) / (target - entry)) * 100))
                      : null;
                    const statusConfig: Record<string, {label:string,bg:string,color:string}> = {
                      in_progress: {label:"IN PROGRESS",
                        bg:"color-mix(in oklch,#fbbf24 20%,transparent)",
                        color:"#92400e"},
                      hit_target:  {label:"HIT TARGET",
                        bg:"color-mix(in oklch,var(--up) 15%,transparent)",
                        color:"var(--teal)"},
                      invalidated: {label:"INVALIDATED",
                        bg:"color-mix(in oklch,var(--down) 12%,transparent)",
                        color:"var(--down)"},
                      no_target:   {label:"NO TARGET",
                        bg:"var(--bg-3)",color:"var(--muted)"},
                    };
                    const sc = statusConfig[post.tracker_status ?? "no_target"] ?? statusConfig.no_target;

                    return (
                      <div key={post.id}
                        style={{display:"grid",
                          gridTemplateColumns:"90px 170px 90px 90px 90px 80px 140px 100px",
                          padding:"13px 16px",alignItems:"center",
                          borderBottom: idx < arr.length-1
                            ? "1px solid var(--line)" : "none",
                          transition:"background 0.1s",cursor:"pointer"}}
                        onClick={() => window.open(tweetUrl,"_blank")}
                        onMouseEnter={e =>
                          (e.currentTarget as HTMLElement).style.backgroundColor="var(--bg-2)"}
                        onMouseLeave={e =>
                          (e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>

                        {/* Date */}
                        <span style={{fontFamily:"'JetBrains Mono',monospace",
                          fontSize:"11.5px",color:"var(--muted)"}}>
                          {new Date(post.posted_at).toLocaleDateString("en-US",
                            {month:"short",day:"numeric"})}
                        </span>

                        {/* Influencer */}
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {post.influencer?.profile_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.influencer.profile_image_url}
                              style={{width:26,height:26,borderRadius:"50%",
                                objectFit:"cover",flexShrink:0}} alt=""/>
                          ) : (
                            <div style={{width:26,height:26,borderRadius:"50%",
                              background:grad,display:"flex",alignItems:"center",
                              justifyContent:"center",fontSize:"10px",
                              fontWeight:600,color:"#fff",flexShrink:0}}>
                              {initials}
                            </div>
                          )}
                          <div style={{minWidth:0}}>
                            <p style={{fontSize:"12px",fontWeight:600,
                              color:"var(--ink)",margin:0,
                              whiteSpace:"nowrap",overflow:"hidden",
                              textOverflow:"ellipsis"}}>
                              {post.influencer?.display_name ?? username}
                            </p>
                            <p style={{fontSize:"10px",color:"var(--muted)",
                              margin:0,fontFamily:"'JetBrains Mono',monospace"}}>
                              {handle}
                            </p>
                          </div>
                        </div>

                        {/* Ticker */}
                        <span style={{fontFamily:"'JetBrains Mono',monospace",
                          fontSize:"12px",fontWeight:600,color:"var(--teal)",
                          backgroundColor:"var(--teal-soft)",
                          padding:"3px 8px",borderRadius:6,
                          display:"inline-block"}}>
                          {post.ticker ? `$${post.ticker}` : "—"}
                        </span>

                        {/* Entry */}
                        <span style={{fontFamily:"'JetBrains Mono',monospace",
                          fontSize:"12px",color:"var(--ink-2)"}}>
                          {entry ? `$${entry.toFixed(2)}` : "—"}
                        </span>

                        {/* Current */}
                        <span style={{fontFamily:"'JetBrains Mono',monospace",
                          fontSize:"12px",fontWeight:600,
                          color: current && entry
                            ? (current >= entry ? "var(--up)" : "var(--down)")
                            : "var(--muted)"}}>
                          {current ? `$${current.toFixed(2)}` : "—"}
                        </span>

                        {/* Move */}
                        <span style={{fontFamily:"'JetBrains Mono',monospace",
                          fontSize:"12px",fontWeight:600,
                          color: move === null ? "var(--muted)"
                            : move >= 0 ? "var(--up)" : "var(--down)"}}>
                          {move === null ? "—"
                            : `${move >= 0 ? "+" : ""}${move.toFixed(2)}%`}
                        </span>

                        {/* Progress bar */}
                        <div style={{paddingRight:8}}>
                          {progress !== null ? (
                            <div>
                              <div style={{height:6,borderRadius:3,
                                backgroundColor:"var(--line)",
                                overflow:"hidden",marginBottom:3}}>
                                <div style={{height:"100%",borderRadius:3,
                                  width:`${progress}%`,
                                  backgroundColor: progress >= 100
                                    ? "var(--up)"
                                    : move !== null && move < 0
                                    ? "var(--down)"
                                    : "var(--teal)",
                                  transition:"width 0.3s"}}/>
                              </div>
                              <span style={{fontSize:"10px",
                                fontFamily:"'JetBrains Mono',monospace",
                                color:"var(--muted)"}}>
                                {progress.toFixed(0)}% to target
                              </span>
                            </div>
                          ) : (
                            <span style={{fontSize:"11px",color:"var(--muted)"}}>
                              No target
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <span style={{fontSize:"10px",fontWeight:700,
                          fontFamily:"'JetBrains Mono',monospace",
                          letterSpacing:"0.05em",
                          padding:"4px 8px",borderRadius:6,
                          backgroundColor:sc.bg,color:sc.color,
                          display:"inline-block",whiteSpace:"nowrap"}}>
                          {sc.label}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ backgroundColor: "var(--line)" }} />
              ))
            ) : (
              <>
                <StatCard label="Total Trade Calls" value={stats?.trade_calls ?? 0} />
                <StatCard label="Portfolio Posts"   value={stats?.portfolio_posts ?? 0} />
                <StatCard label="Position Updates"  value={stats?.position_updates ?? 0} />
                <StatCard label="Exits Tracked"     value={stats?.exits ?? 0} />
              </>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-2xl p-6 mb-6 text-sm" style={{ backgroundColor: "var(--card)", color: "var(--down)" }}>
              {error}
            </div>
          )}

          {/* Main two-column layout */}
          <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">

            {/* Left: ticker grid + recent activity */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">

              {/* Section header */}
              <div>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--ink)" }}>
                  Top Collective Holdings
                </h2>
                <p className="text-xs md:text-sm mt-0.5" style={{ color: "var(--ink-2)" }}>
                  Ranked by number of unique influencers tracking each ticker
                </p>
              </div>

              {/* Ticker grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="rounded-2xl h-48 animate-pulse" style={{ backgroundColor: "var(--line)" }} />
                  ))}
                </div>
              ) : tickers.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "var(--card)" }}>
                  <p className="text-sm" style={{ color: "var(--ink-2)" }}>
                    No ticker data yet. Posts will appear after categorization runs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickers.map((t) => (
                    <TickerCard key={t.ticker} t={t} />
                  ))}
                </div>
              )}

              {/* Influencer Holdings */}
              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--ink)" }}>
                    Influencer Holdings
                  </h2>
                  <p className="text-xs md:text-sm mt-0.5" style={{ color: "var(--ink-2)" }}>
                    Tickers each influencer has mentioned in trade calls, portfolio and position updates
                  </p>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ backgroundColor: "var(--line)" }} />
                    ))}
                  </div>
                ) : influencerHoldings.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "var(--card)" }}>
                    <p className="text-sm" style={{ color: "var(--ink-2)" }}>No holdings data yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {influencerHoldings.slice(0, 20).map((inf) => (
                      <InfluencerHoldingRow key={inf.x_handle} inf={inf} />
                    ))}
                    <p className="text-xs text-center mt-1" style={{ color: "var(--ink-2)" }}>
                      Showing top 20 influencers by holdings activity. View individual profiles on the{" "}
                      <a
                        href="/leaderboard"
                        style={{ color: "var(--teal)", textDecoration: "underline" }}
                      >
                        Leaderboard
                      </a>
                      {" "}for full history →
                    </p>
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--ink)" }}>
                    Latest Influencer Moves
                  </h2>
                  <p className="text-xs md:text-sm mt-0.5" style={{ color: "var(--ink-2)" }}>
                    Trade calls, portfolio updates and position changes
                  </p>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--line)" }} />
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "var(--card)" }}>
                    <p className="text-sm" style={{ color: "var(--ink-2)" }}>No recent activity.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {recentActivity.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right panel — desktop only */}
            <div className="hidden xl:block flex-shrink-0" style={{ width: 280 }}>
              <div className="sticky flex flex-col gap-0" style={{ top: 56 + 32 }}>
                <RightSidebar
                  mostConvicted={data?.most_convicted ?? null}
                  consensusBuys={data?.consensus_buys ?? []}
                  recentExits={data?.recent_exits ?? []}
                  loading={loading}
                />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
