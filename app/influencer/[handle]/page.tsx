"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import PostCard, { type Post } from "@/components/PostCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Influencer = {
  id: string;
  x_handle: string;
  display_name: string;
  profile_image_url: string | null;
  follower_count: number | null;
};

type CategoryBreakdown = {
  category: string;
  count: number;
  pct: number;
};

type TickerMention = {
  ticker: string;
  count: number;
};

type Stats = {
  total_posts: number;
  trade_calls: number;
  performance_posts: number;
  exits: number;
  win_rate: number | null;
  transparency_score: boolean;
  most_mentioned_tickers: TickerMention[];
  category_breakdown: CategoryBreakdown[];
  most_active_time: "morning" | "afternoon" | "evening";
};

type Holding = {
  ticker: string;
  count: number;
};

type RawPost = {
  id: string;
  content: string;
  category: string;
  sentiment: string | null;
  confidence: number | null;
  ticker_symbols: string[];
  posted_at: string;
  x_post_id: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFollowers(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const CATEGORY_COLOR: Record<string, string> = {
  trade_call:      "var(--teal)",
  position_update: "#1a56db",
  exit:            "#b45309",
  performance:     "#7c3aed",
  portfolio:       "#0891b2",
  watchlist:       "#d97706",
  analysis:        "var(--ink-2)",
  noise:           "var(--muted)",
};

const CATEGORY_LABEL: Record<string, string> = {
  trade_call:      "Trade Call",
  position_update: "Position Update",
  exit:            "Exit",
  performance:     "Performance",
  portfolio:       "Portfolio",
  watchlist:       "Watchlist",
  analysis:        "Analysis",
  noise:           "Noise",
};

const ALL_CATEGORIES = [
  "trade_call", "position_update", "exit", "performance",
  "portfolio", "watchlist", "analysis",
];

const TIME_LABEL: Record<string, string> = {
  morning:   "🌅 Morning (6am–12pm)",
  afternoon: "☀️ Afternoon (12pm–6pm)",
  evening:   "🌙 Evening / Night",
};

// ─── Avatar (large, for profile header) ──────────────────────────────────────

function ProfileAvatar({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="rounded-full object-cover flex-shrink-0 w-[60px] h-[60px] md:w-[80px] md:h-[80px]"
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white w-[60px] h-[60px] md:w-[80px] md:h-[80px]"
      style={{ backgroundColor: "var(--teal)" }}
    >
      {initials}
    </div>
  );
}

// ─── Profile header card ──────────────────────────────────────────────────────

function ProfileHeader({
  influencer,
  stats,
}: {
  influencer: Influencer;
  stats: Stats;
}) {
  const handle = influencer.x_handle.replace(/^@/, "");
  const xUrl = `https://x.com/${handle}`;

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{
        backgroundColor: "var(--card)",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
      }}
    >
      {/* Top: avatar + name + follow button */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProfileAvatar src={influencer.profile_image_url} name={influencer.display_name} />
          <div className="flex flex-col gap-0.5">
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "var(--teal)",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              fontWeight: 500,
              marginBottom: 8,
            }}>Influencer Profile</p>
            <h1 style={{ fontSize: "34px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", margin: "0 0 8px" }}>
              {influencer.display_name}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-2)" }}>
              {influencer.x_handle}
            </p>
            {influencer.follower_count != null && (
              <p style={{ fontSize: "0.75rem", color: "var(--ink-2)", marginTop: 2 }}>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                  {formatFollowers(influencer.follower_count)}
                </span>{" "}
                followers
              </p>
            )}
          </div>
        </div>

        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors flex-shrink-0"
          style={{ backgroundColor: "var(--teal)", color: "#ffffff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-2)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal)")}
        >
          Follow on X ↗
        </a>
      </div>

      {/* Stats row */}
      <div
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(110px, 1fr))",
          gap: 1,
          borderRadius: "0.75rem",
          overflow: "auto",
          backgroundColor: "var(--line)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {[
          { label: "Total Signals",  value: stats.total_posts },
          { label: "Trade Calls",    value: stats.trade_calls },
          {
            label: "Win Rate",
            value: stats.win_rate != null ? `${stats.win_rate}%` : "N/A",
            color: stats.win_rate != null && stats.win_rate > 50 ? "var(--teal)" : stats.win_rate != null ? "var(--down)" : "var(--ink-2)",
          },
          {
            label: "Transparency",
            value: stats.transparency_score ? "Posts Losses ✅" : "No Losses ⚠️",
            color: stats.transparency_score ? "var(--teal)" : "#d97706",
            small: true,
          },
        ].map(({ label, value, color, small }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center py-4 px-3"
            style={{ backgroundColor: "var(--card)" }}
          >
            <p
              style={{
                fontSize: small ? "0.8125rem" : "1.5rem",
                fontWeight: 700,
                color: color ?? "var(--ink)",
                lineHeight: 1.1,
                textAlign: "center",
              }}
            >
              {value}
            </p>
            <p className="type-label mt-1 text-center" style={{ color: "var(--ink-2)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category filter pills ────────────────────────────────────────────────────

function FilterPills({
  active,
  counts,
  onChange,
}: {
  active: string;
  counts: Record<string, number>;
  onChange: (cat: string) => void;
}) {
  const pills = [
    { key: "all", label: "All" },
    ...ALL_CATEGORIES
      .filter((c) => (counts[c] ?? 0) > 0)
      .map((c) => ({ key: c, label: CATEGORY_LABEL[c] ?? c })),
  ];

  return (
    <div
      className="flex gap-2 md:flex-wrap [&::-webkit-scrollbar]:hidden"
      style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 4,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {pills.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0"
            style={{
              backgroundColor: isActive ? "var(--teal)" : "var(--card)",
              color: isActive ? "#ffffff" : "var(--ink-2)",
              border: `1px solid ${isActive ? "var(--teal)" : "var(--line)"}`,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-soft)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)";
            }}
          >
            {label}
            {key !== "all" && counts[key] != null && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "var(--teal-soft)" }}
              >
                {counts[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Holdings pie chart ───────────────────────────────────────────────────────

const PIE_COLORS = [
  "#006859", "#0891b2", "#7c3aed", "#d97706",
  "#b45309", "#dc2626", "#059669", "#6366f1",
];

function HoldingsPieChart({ holdings }: { holdings: Holding[] }) {
  if (holdings.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--ink-2)" }}>
        No explicit holdings found in recent posts
      </p>
    );
  }

  const total = holdings.reduce((s, h) => s + h.count, 0);

  let cumulative = 0;
  const stops = holdings.map((h, i) => {
    const pct = (h.count / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start.toFixed(2)}% ${cumulative.toFixed(2)}%`;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pie */}
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: 160,
          height: 160,
          background: `conic-gradient(${stops.join(", ")})`,
        }}
      />

      {/* Legend */}
      <div className="w-full flex flex-col gap-1.5">
        {holdings.map((h, i) => (
          <div key={h.ticker} className="flex items-center gap-2">
            <span
              className="rounded-full flex-shrink-0"
              style={{ width: 10, height: 10, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-xs font-semibold flex-1" style={{ color: "var(--ink)" }}>
              ${h.ticker}
            </span>
            <span className="text-xs" style={{ color: "var(--ink-2)" }}>
              {h.count} mention{h.count !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--muted)" }}>
        Based on public posts only. Not verified financial data.
      </p>
    </div>
  );
}

// ─── Right panel ─────────────────────────────────────────────────────────────

function RightPanel({ stats, holdings }: { stats: Stats; holdings: Holding[] }) {
  return (
    <div className="flex flex-col gap-5">

      {/* Claimed holdings pie chart */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
      >
        <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--bg-2)", borderBottom: "1px solid var(--line)" }}>
          <p className="type-label" style={{ color: "var(--ink-2)" }}>Claimed Holdings</p>
          <span
            className="text-xs rounded-full flex items-center justify-center cursor-default flex-shrink-0"
            style={{ width: 16, height: 16, backgroundColor: "var(--line)", color: "var(--ink-2)", fontSize: 10, fontWeight: 700 }}
            title="Based on explicit buy/hold statements in posts"
          >
            i
          </span>
        </div>
        <div className="p-4">
          <HoldingsPieChart holdings={holdings} />
        </div>
      </div>

      {/* Category breakdown */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
      >
        <div className="px-5 py-3" style={{ backgroundColor: "var(--bg-2)", borderBottom: "1px solid var(--line)" }}>
          <p className="type-label" style={{ color: "var(--ink-2)" }}>Post Breakdown</p>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {stats.category_breakdown.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--ink-2)" }}>No data</p>
          ) : (
            stats.category_breakdown.map(({ category, count, pct }) => {
              const color = CATEGORY_COLOR[category] ?? "var(--muted)";
              const label = CATEGORY_LABEL[category] ?? category;
              return (
                <div key={category} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex-shrink-0 rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: color }}
                      />
                      <p className="text-xs font-medium truncate" style={{ color: "var(--ink)" }}>
                        {label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs" style={{ color: "var(--ink-2)" }}>{count}</p>
                      <p className="text-xs font-semibold w-8 text-right" style={{ color }}>
                        {pct}%
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: "var(--teal-soft)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top mentioned tickers */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
      >
        <div className="px-5 py-3" style={{ backgroundColor: "var(--bg-2)", borderBottom: "1px solid var(--line)" }}>
          <p className="type-label" style={{ color: "var(--ink-2)" }}>Top Tickers</p>
        </div>
        {stats.most_mentioned_tickers.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--ink-2)" }}>No tickers found</p>
        ) : (
          <div className="flex flex-col">
            {stats.most_mentioned_tickers.map((t, idx) => (
              <div
                key={t.ticker}
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: idx < stats.most_mentioned_tickers.length - 1 ? "1px solid var(--bg-2)" : "none" }}
              >
                <p className="text-xs font-bold w-5 flex-shrink-0" style={{ color: "var(--ink-2)" }}>
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "var(--teal-soft)", color: "var(--teal)" }}
                >
                  ${t.ticker}
                </span>
                <p className="flex-1 text-xs" style={{ color: "var(--ink-2)" }}>
                  {t.count} mention{t.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most active time */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-2"
        style={{ backgroundColor: "var(--card)", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
      >
        <p className="type-label" style={{ color: "var(--ink-2)" }}>Most Active</p>
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {TIME_LABEL[stats.most_active_time] ?? stats.most_active_time}
        </p>
        <p className="text-xs" style={{ color: "var(--ink-2)" }}>
          Based on post timestamps (UTC)
        </p>
      </div>

    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-5 animate-pulse" style={{ backgroundColor: "var(--card)", boxShadow: "0px 12px 32px rgba(23,29,27,0.06)" }}>
      <div className="flex items-center gap-4">
        <div className="rounded-full flex-shrink-0" style={{ width: 80, height: 80, backgroundColor: "var(--line)" }} />
        <div className="flex flex-col gap-2">
          <div className="h-6 w-40 rounded" style={{ backgroundColor: "var(--line)" }} />
          <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--line)" }} />
        </div>
      </div>
      <div className="h-20 rounded-xl" style={{ backgroundColor: "var(--line)" }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InfluencerProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);

  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [rawPosts, setRawPosts] = useState<RawPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/influencer/${encodeURIComponent(handle)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setInfluencer(d.influencer);
        setStats(d.stats);
        setHoldings(d.holdings ?? []);
        setRawPosts(d.posts ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [handle]);

  const posts: Post[] = rawPosts.map((p) => ({
    ...p,
    influencer: influencer
      ? {
          x_handle: influencer.x_handle,
          display_name: influencer.display_name,
          profile_image_url: influencer.profile_image_url,
        }
      : null,
  }));

  const filteredPosts =
    activeFilter === "all" ? posts : posts.filter((p) => p.category === activeFilter);

  const categoryCounts = rawPosts.reduce<Record<string, number>>((acc, p) => {
    if (p.category && p.category !== "noise") {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-2)" }}>
      <Sidebar />
      <TopNav />

      <main
        className="flex-1 md:ml-[220px] px-6"
        style={{ paddingTop: 56 + 32, paddingBottom: 48, minWidth: 0 }}
      >
        <div className="max-w-[1000px] mx-auto flex flex-col gap-6">

          {/* Back link */}
          <div className="pt-8 md:pt-0">
            <a
              href="/leaderboard"
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--teal)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--teal-2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--teal)")}
            >
              ← Back to Leaderboard
            </a>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl p-6 text-sm" style={{ backgroundColor: "var(--card)", color: "var(--down)" }}>
              {error === "Influencer not found"
                ? `No influencer found for @${handle}.`
                : error}
            </div>
          )}

          {/* Profile header */}
          {loading ? (
            <HeaderSkeleton />
          ) : influencer && stats ? (
            <ProfileHeader influencer={influencer} stats={stats} />
          ) : null}

          {/* Two-column body */}
          {!loading && !error && influencer && stats && (
            <div className="flex flex-col md:flex-row gap-5 items-start">

              {/* Top/Left — posts feed */}
              <div className="flex flex-col gap-4 w-full md:w-auto md:flex-none" style={{ flex: "3", minWidth: 0 }}>
                <FilterPills
                  active={activeFilter}
                  counts={categoryCounts}
                  onChange={setActiveFilter}
                />

                {filteredPosts.length === 0 ? (
                  <div
                    className="rounded-2xl p-10 text-center text-sm"
                    style={{ backgroundColor: "var(--card)", color: "var(--ink-2)" }}
                  >
                    No posts in this category.
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>

              {/* Bottom/Right — sidebar */}
              <div className="w-full md:w-auto md:flex-none" style={{ flex: "2", minWidth: 0 }}>
                <RightPanel stats={stats} holdings={holdings} />
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
