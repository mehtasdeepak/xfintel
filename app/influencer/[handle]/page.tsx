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
  trade_call:      "#006859",
  position_update: "#1a56db",
  exit:            "#b45309",
  performance:     "#7c3aed",
  portfolio:       "#0891b2",
  watchlist:       "#d97706",
  analysis:        "#3d4946",
  noise:           "#9eb3ae",
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
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: 80, height: 80 }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white"
      style={{ width: 80, height: 80, backgroundColor: "#006859" }}
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
        backgroundColor: "#ffffff",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
      }}
    >
      {/* Top: avatar + name + follow button */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <ProfileAvatar src={influencer.profile_image_url} name={influencer.display_name} />
          <div className="flex flex-col gap-0.5">
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#171d1b",
                lineHeight: 1.2,
              }}
            >
              {influencer.display_name}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#3d4946" }}>
              {influencer.x_handle}
            </p>
            {influencer.follower_count != null && (
              <p style={{ fontSize: "0.75rem", color: "#3d4946", marginTop: 2 }}>
                <span style={{ fontWeight: 600, color: "#171d1b" }}>
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
          style={{ backgroundColor: "#006859", color: "#ffffff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#004d42")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#006859")}
        >
          Follow on X ↗
        </a>
      </div>

      {/* Stats row */}
      <div
        className="grid gap-px rounded-xl overflow-hidden"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", backgroundColor: "#e0ebe6" }}
      >
        {[
          { label: "Total Signals",  value: stats.total_posts },
          { label: "Trade Calls",    value: stats.trade_calls },
          {
            label: "Win Rate",
            value: stats.win_rate != null ? `${stats.win_rate}%` : "N/A",
            color: stats.win_rate != null && stats.win_rate > 50 ? "#006859" : stats.win_rate != null ? "#ba1a1a" : "#3d4946",
          },
          {
            label: "Transparency",
            value: stats.transparency_score ? "Posts Losses ✅" : "No Losses ⚠️",
            color: stats.transparency_score ? "#006859" : "#d97706",
            small: true,
          },
        ].map(({ label, value, color, small }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center py-4 px-3"
            style={{ backgroundColor: "#ffffff" }}
          >
            <p
              style={{
                fontSize: small ? "0.8125rem" : "1.5rem",
                fontWeight: 700,
                color: color ?? "#171d1b",
                lineHeight: 1.1,
                textAlign: "center",
              }}
            >
              {value}
            </p>
            <p className="type-label mt-1 text-center" style={{ color: "#3d4946" }}>
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
    <div className="flex flex-wrap gap-2">
      {pills.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              backgroundColor: isActive ? "#006859" : "#ffffff",
              color: isActive ? "#ffffff" : "#3d4946",
              border: `1px solid ${isActive ? "#006859" : "#e0ebe6"}`,
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#eff5f2";
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
            }}
          >
            {label}
            {key !== "all" && counts[key] != null && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#eff5f2" }}
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

// ─── Right panel ─────────────────────────────────────────────────────────────

function RightPanel({ stats }: { stats: Stats }) {
  return (
    <div className="flex flex-col gap-5">

      {/* Category breakdown */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#ffffff", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
      >
        <div className="px-5 py-3" style={{ backgroundColor: "#f5fbf7", borderBottom: "1px solid #e0ebe6" }}>
          <p className="type-label" style={{ color: "#3d4946" }}>Post Breakdown</p>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {stats.category_breakdown.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#3d4946" }}>No data</p>
          ) : (
            stats.category_breakdown.map(({ category, count, pct }) => {
              const color = CATEGORY_COLOR[category] ?? "#9eb3ae";
              const label = CATEGORY_LABEL[category] ?? category;
              return (
                <div key={category} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex-shrink-0 rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: color }}
                      />
                      <p className="text-xs font-medium truncate" style={{ color: "#171d1b" }}>
                        {label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs" style={{ color: "#3d4946" }}>{count}</p>
                      <p className="text-xs font-semibold w-8 text-right" style={{ color }}>
                        {pct}%
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: "#eff5f2" }}>
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
        style={{ backgroundColor: "#ffffff", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
      >
        <div className="px-5 py-3" style={{ backgroundColor: "#f5fbf7", borderBottom: "1px solid #e0ebe6" }}>
          <p className="type-label" style={{ color: "#3d4946" }}>Top Tickers</p>
        </div>
        {stats.most_mentioned_tickers.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#3d4946" }}>No tickers found</p>
        ) : (
          <div className="flex flex-col">
            {stats.most_mentioned_tickers.map((t, idx) => (
              <div
                key={t.ticker}
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: idx < stats.most_mentioned_tickers.length - 1 ? "1px solid #f5fbf7" : "none" }}
              >
                <p className="text-xs font-bold w-5 flex-shrink-0" style={{ color: "#3d4946" }}>
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#eff5f2", color: "#006859" }}
                >
                  ${t.ticker}
                </span>
                <p className="flex-1 text-xs" style={{ color: "#3d4946" }}>
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
        style={{ backgroundColor: "#ffffff", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
      >
        <p className="type-label" style={{ color: "#3d4946" }}>Most Active</p>
        <p className="text-sm font-semibold" style={{ color: "#171d1b" }}>
          {TIME_LABEL[stats.most_active_time] ?? stats.most_active_time}
        </p>
        <p className="text-xs" style={{ color: "#3d4946" }}>
          Based on post timestamps (UTC)
        </p>
      </div>

    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-5 animate-pulse" style={{ backgroundColor: "#ffffff", boxShadow: "0px 12px 32px rgba(23,29,27,0.06)" }}>
      <div className="flex items-center gap-4">
        <div className="rounded-full flex-shrink-0" style={{ width: 80, height: 80, backgroundColor: "#e0ebe6" }} />
        <div className="flex flex-col gap-2">
          <div className="h-6 w-40 rounded" style={{ backgroundColor: "#e0ebe6" }} />
          <div className="h-4 w-24 rounded" style={{ backgroundColor: "#e0ebe6" }} />
        </div>
      </div>
      <div className="h-20 rounded-xl" style={{ backgroundColor: "#e0ebe6" }} />
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
        setRawPosts(d.posts ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [handle]);

  // Inject influencer into each post so PostCard can render the avatar/name
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

  // Count per category for filter pill badges
  const categoryCounts = rawPosts.reduce<Record<string, number>>((acc, p) => {
    if (p.category && p.category !== "noise") {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f5fbf7" }}>
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
              style={{ color: "#006859" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#004d42")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#006859")}
            >
              ← Back to Leaderboard
            </a>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl p-6 text-sm" style={{ backgroundColor: "#ffffff", color: "#ba1a1a" }}>
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
            <div className="flex gap-5 items-start">

              {/* Left — posts feed (60%) */}
              <div className="flex flex-col gap-4" style={{ flex: "3", minWidth: 0 }}>
                <FilterPills
                  active={activeFilter}
                  counts={categoryCounts}
                  onChange={setActiveFilter}
                />

                {filteredPosts.length === 0 ? (
                  <div
                    className="rounded-2xl p-10 text-center text-sm"
                    style={{ backgroundColor: "#ffffff", color: "#3d4946" }}
                  >
                    No posts in this category.
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>

              {/* Right — sidebar (40%) */}
              <div style={{ flex: "2", minWidth: 0 }}>
                <RightPanel stats={stats} />
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
