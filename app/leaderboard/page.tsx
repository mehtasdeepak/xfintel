"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Influencer = {
  id: string;
  x_handle: string;
  display_name: string;
  profile_image_url: string | null;
  follower_count: number | null;
  total_signals: number;
  trade_calls: number;
  performance_posts: number;
  win_rate: number | null;
  transparency_score: boolean;
  dominant_sentiment: string | null;
};

type Summary = {
  total_influencers: number;
  total_signals_week: number;
  most_active: string | null;
  most_active_signals?: number | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEFRAMES = [
  { label: "Last 7 Days",  days: 7  },
  { label: "Last 14 Days", days: 14 },
  { label: "Last 30 Days", days: 30 },
  { label: "All Time",     days: 0  },
];

const RANK_ACCENT: Record<number, string> = {
  1: "#f59e0b",
  2: "#9ca3af",
  3: "#b45309",
};

const ROW_BG: Record<number, string> = {
  1: "color-mix(in oklch, #fbbf24 12%, transparent)",
  2: "var(--bg-2)",
  3: "var(--bg-2)",
};

const FREE_TIER_LIMIT = 20;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: "var(--teal)" }}
    >
      {initials}
    </div>
  );
}

function WinRatePill({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "var(--bg-3)", color: "var(--muted)" }}>
        N/A
      </span>
    );
  }
  if (value >= 70) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "color-mix(in oklch, var(--up) 20%, transparent)", color: "var(--teal)" }}>
        {value === 100 ? "⭐ " : ""}{value}%
      </span>
    );
  }
  if (value >= 50) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "color-mix(in oklch, #fbbf24 30%, transparent)", color: "oklch(0.52 0.12 60)" }}>
        {value}%
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "color-mix(in oklch, var(--down) 18%, transparent)", color: "var(--down)" }}>
      {value}%
    </span>
  );
}

function TransparencyBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "color-mix(in oklch, var(--up) 20%, transparent)", color: "var(--teal)" }}>
      Posts Losses ✅
    </span>
  ) : (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "color-mix(in oklch, #fbbf24 30%, transparent)", color: "oklch(0.62 0.15 60)" }}>
      No Losses ⚠️
    </span>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="w-full md:flex-1 flex flex-col gap-1"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid #e5e7eb",
        padding: "16px 18px",
        boxShadow: hovered ? "0px 20px 40px rgba(23, 29, 27, 0.12)" : "0px 12px 32px rgba(23, 29, 27, 0.06)",
        borderRadius: "14px",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</p>
      <p
        className="text-[2rem] md:text-[2rem]"
        style={{ fontWeight: 600, fontSize: "2rem", letterSpacing: "-0.02em", color: "var(--teal)", lineHeight: 1.1, wordBreak: "break-word", fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: "12px", color: "var(--ink-2)", marginTop: 2 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-5" style={{ borderBottom: "1px solid var(--bg-2)" }}>
      <div className="w-8 h-5 rounded animate-pulse" style={{ backgroundColor: "var(--line)" }} />
      <div className="flex items-center gap-3 flex-1">
        <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: "var(--line)" }} />
        <div className="flex flex-col gap-1.5">
          <div className="w-28 h-4 rounded animate-pulse" style={{ backgroundColor: "var(--line)" }} />
          <div className="w-20 h-3 rounded animate-pulse" style={{ backgroundColor: "var(--line)" }} />
        </div>
      </div>
      {[80, 72, 70, 64].map((w, i) => (
        <div key={i} className="hidden md:block h-4 rounded animate-pulse" style={{ width: w, backgroundColor: "var(--line)" }} />
      ))}
      <div className="w-24 h-8 rounded-full animate-pulse" style={{ backgroundColor: "var(--line)" }} />
    </div>
  );
}

// ─── Row (extracted to keep JSX readable) ─────────────────────────────────────

function LeaderboardRow({ inf, rank, locked = false }: { inf: Influencer; rank: number; locked?: boolean }) {
  const accentColor = RANK_ACCENT[rank];
  const rowBg = ROW_BG[rank];
  const rankLabel = String(rank).padStart(2, "0");
  const isTop3 = rank <= 3;

  return (
    <div
      className="flex items-center gap-4 px-5 transition-colors"
      style={{
        paddingTop: 20,
        paddingBottom: 20,
        borderBottom: "1px solid var(--bg-2)",
        borderLeft: `4px solid ${accentColor ?? "transparent"}`,
        backgroundColor: rowBg ?? "transparent",
      }}
      onMouseEnter={(e) => {
        if (!rowBg) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = rowBg ?? "transparent";
      }}
    >
      {/* Rank */}
      <div className="w-12 flex-shrink-0 flex items-center gap-1.5">
        <span
          style={{
            color: accentColor ?? "var(--teal)",
            fontWeight: isTop3 ? 900 : 700,
            fontSize: isTop3 ? "1.1rem" : "0.875rem",
            lineHeight: 1,
          }}
        >
          {rankLabel}
        </span>
        {rank === 1 && <span className="text-sm">🏆</span>}
      </div>

      {/* Influencer */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={inf.profile_image_url} name={inf.display_name} size={36} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
            {inf.display_name}
          </p>
          <p className="text-[11px]" style={{ color: "var(--ink-2)", opacity: 0.75 }}>
            {inf.x_handle}
          </p>
        </div>
      </div>

      {/* Total Signals */}
      <p className="w-[110px] hidden md:block text-right text-sm font-medium" style={{ color: "var(--ink)" }}>
        {inf.total_signals}
      </p>

      {/* Trade Calls */}
      <p className="w-[100px] hidden md:block text-right text-sm font-medium" style={{ color: "var(--ink)" }}>
        {inf.trade_calls}
      </p>

      {/* Win Rate */}
      <div className="w-[100px] hidden md:flex justify-end">
        <WinRatePill value={inf.win_rate} />
      </div>

      {/* Transparency */}
      <div className="w-[110px] hidden md:flex justify-center">
        <TransparencyBadge value={inf.transparency_score} />
      </div>

      {/* Action */}
      <div className="w-[110px] flex justify-end">
        {locked ? (
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ border: "1px solid var(--line)", color: "var(--muted)" }}
          >
            View Profile
          </div>
        ) : (
          <a
            href={`/influencer/${inf.x_handle.replace(/^@/, "")}`}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{ border: "1px solid var(--teal)", color: "var(--teal)", backgroundColor: "transparent" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-soft)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
          >
            View Profile
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Mobile podium (top 3) ────────────────────────────────────────────────────

function MobilePodium({ top3 }: { top3: Influencer[] }) {
  const first  = top3[0] ?? null;
  const second = top3[1] ?? null;
  const third  = top3[2] ?? null;

  function PodiumItem({
    inf,
    rank,
    size,
    elevated = false,
  }: {
    inf: Influencer;
    rank: number;
    size: number;
    elevated?: boolean;
  }) {
    const accentColor = RANK_ACCENT[rank] ?? "var(--teal)";
    const truncated =
      inf.display_name.length > 10
        ? inf.display_name.slice(0, 10) + "…"
        : inf.display_name;
    const winText = inf.win_rate != null ? `${inf.win_rate}%` : "N/A";

    return (
      <div
        className="flex flex-col items-center gap-1.5"
        style={{ paddingBottom: elevated ? 40 : 0 }}
      >
        {/* Avatar with optional ring + rank badge */}
        <div className="relative flex-shrink-0">
          {elevated ? (
            <div
              style={{
                borderRadius: "9999px",
                border: "3px solid var(--teal)",
                padding: 3,
                display: "inline-flex",
              }}
            >
              <Avatar src={inf.profile_image_url} name={inf.display_name} size={size} />
            </div>
          ) : (
            <Avatar src={inf.profile_image_url} name={inf.display_name} size={size} />
          )}
          {/* Rank badge */}
          <span
            className="absolute bottom-0 right-0 rounded-full flex items-center justify-center font-bold text-white"
            style={{
              width: 20,
              height: 20,
              backgroundColor: accentColor,
              fontSize: "0.6rem",
              border: "2px solid var(--card)",
            }}
          >
            {rank}
          </span>
        </div>

        {/* WINNER label for rank 1 */}
        {elevated && (
          <span
            style={{
              fontSize: "0.5rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--teal)",
            }}
          >
            WINNER
          </span>
        )}

        <p
          className="text-xs font-semibold text-center"
          style={{ color: "var(--ink)", maxWidth: size + 16 }}
        >
          {truncated}
        </p>
        <p className="text-xs font-bold" style={{ color: "var(--teal)" }}>
          {winText}
        </p>
      </div>
    );
  }

  return (
    <div
      className="md:hidden rounded-2xl p-6 flex flex-col gap-5"
      style={{
        backgroundColor: "var(--card)",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
      }}
    >
      <p className="type-label text-center" style={{ color: "var(--ink-2)" }}>
        Top 3 This Period
      </p>

      <div className="flex items-end justify-center gap-8">
        {second && <PodiumItem inf={second} rank={2} size={64} />}
        {first  && <PodiumItem inf={first}  rank={1} size={80} elevated />}
        {third  && <PodiumItem inf={third}  rank={3} size={64} />}
      </div>
    </div>
  );
}

// ─── Mobile rank row (ranks 4+) ───────────────────────────────────────────────

function MobileRankRow({ inf, rank }: { inf: Influencer; rank: number }) {
  const handle = inf.x_handle.replace(/^@/, "");
  return (
    <div
      className="flex items-center gap-3 px-4 rounded-xl"
      style={{
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: "var(--card)",
        boxShadow: "0px 2px 8px rgba(23, 29, 27, 0.06)",
      }}
    >
      <p
        className="text-sm font-bold flex-shrink-0 w-6 text-center"
        style={{ color: "var(--teal)" }}
      >
        {String(rank).padStart(2, "0")}
      </p>
      <Avatar src={inf.profile_image_url} name={inf.display_name} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {inf.display_name}
        </p>
        <p className="text-xs" style={{ color: "var(--ink-2)" }}>
          {inf.total_signals} signals
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {inf.win_rate != null && inf.win_rate > 0 ? (
          <WinRatePill value={inf.win_rate} />
        ) : (
          <span className="text-xs" style={{ color: "var(--muted)" }}>No Trades</span>
        )}
        <a
          href={`/influencer/${handle}`}
          className="text-xs font-medium"
          style={{ color: "var(--teal)" }}
        >
          View Profile →
        </a>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDays, setActiveDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/leaderboard?days=${activeDays}`)
      .then((r) => r.json())
      .then((d) => {
        setInfluencers(d.influencers ?? []);
        setSummary(d.summary ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeDays]);

  const visibleRows = influencers.slice(0, FREE_TIER_LIMIT);
  const lockedRows = influencers.slice(FREE_TIER_LIMIT);
  const activeLabel = TIMEFRAMES.find((t) => t.days === activeDays)?.label ?? "Last 7 Days";

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-2)" }}>
      <Sidebar />
      <TopNav />

      <main className="flex-1 md:ml-[220px] px-6" style={{ paddingTop: 56 + 32, minWidth: 0, paddingBottom: 48 }}>
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8">

          {/* Header row */}
          <div className="flex items-start justify-between gap-6 pt-8 md:pt-0">
            <div className="flex flex-col gap-1">
              {/* Performance index label */}
              <p className="type-label" style={{ color: "var(--teal)" }}>Performance Index</p>
              <h1 className="type-display" style={{ color: "var(--ink)" }}>Fin X Leaderboard</h1>
              <p className="type-body mt-1 max-w-lg" style={{ color: "var(--ink-2)" }}>
                Real-time ranking of financial voices based on AI verification of public entry and exit signals.
              </p>
            </div>

            {/* Timeframe dropdown + Filter Metrics */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-2">
              {/* Timeframe dropdown */}
              <div className="relative">
                <select
                  value={activeDays}
                  onChange={(e) => setActiveDays(Number(e.target.value))}
                  className="appearance-none pl-4 pr-8 py-2 rounded-full text-sm font-medium outline-none cursor-pointer transition-colors"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--ink)",
                    border: "1px solid var(--line)",
                    boxShadow: "0px 1px 4px rgba(23,29,27,0.06)",
                  }}
                >
                  {TIMEFRAMES.map(({ label, days }) => (
                    <option key={days} value={days}>{label}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--ink-2)" }}
                />
              </div>

              {/* Filter Metrics button */}
              <button
                className="flex items-center gap-2 pl-4 pr-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--ink-2)",
                  border: "1px solid var(--line)",
                  boxShadow: "0px 1px 4px rgba(23,29,27,0.06)",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-soft)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)")}
              >
                <SlidersHorizontal size={14} />
                Filter Metrics
              </button>
            </div>
          </div>

          {/* Summary stat cards */}
          {summary && (
            <div className="flex flex-col md:flex-row gap-4">
              <StatCard label="Influencers Tracked" value={summary.total_influencers} />
              <StatCard label="Signals This Week"   value={summary.total_signals_week.toLocaleString()} />
              <StatCard label="Most Active"         value={summary.most_active ?? "—"} subtitle={summary.most_active_signals ? `${summary.most_active_signals} signals · last 7 days` : undefined} />
            </div>
          )}

          {/* ── Mobile podium + simplified rank list ── */}
          {!loading && !error && influencers.length > 0 && (
            <div className="md:hidden flex flex-col gap-3">
              <MobilePodium top3={influencers.slice(0, 3)} />

              {influencers.slice(3, FREE_TIER_LIMIT).length > 0 && (
                <>
                  <p className="type-label mt-1" style={{ color: "var(--ink-2)" }}>
                    Ranks 4–{Math.min(FREE_TIER_LIMIT, influencers.length)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {influencers.slice(3, FREE_TIER_LIMIT).map((inf, idx) => (
                      <MobileRankRow key={inf.id} inf={inf} rank={idx + 4} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Leaderboard table card — desktop only */}
          <div
            className="hidden md:block overflow-hidden"
            style={{ backgroundColor: "var(--card)", borderRadius: "1rem", boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)" }}
          >
            {/* Table header */}
            <div
              className="flex items-center gap-4 px-5 py-3"
              style={{ backgroundColor: "var(--bg-3)", borderBottom: "1px solid var(--line)" }}
            >
              <p className="w-12 flex-shrink-0" style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Rank</p>
              <p className="flex-1"             style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Influencer</p>
              <p className="w-[110px] hidden md:block text-right" style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Total</p>
              <p className="w-[100px] hidden md:block text-right" style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Trades</p>
              <p className="w-[100px] hidden md:block text-right" style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Win Rate</p>
              <p className="w-[110px] hidden md:block text-center" style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Transparency</p>
              <p className="w-[110px] text-right"                 style={{ color: "var(--ink-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Action</p>
            </div>

            {/* Active timeframe label */}
            <div className="px-5 py-2.5" style={{ backgroundColor: "var(--bg-3)", borderBottom: "1px solid #f0f4f2" }}>
              <p style={{ color: "var(--teal)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "0.12em" }}>{`SHOWING · ${activeLabel.toUpperCase()}`}</p>
            </div>

            {/* Body */}
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <div className="p-8 text-sm text-center" style={{ color: "var(--down)" }}>{error}</div>
            ) : (
              <div className="relative">
                {/* Free-tier visible rows */}
                {visibleRows.map((inf, idx) => (
                  <LeaderboardRow key={inf.id} inf={inf} rank={idx + 1} />
                ))}

                {/* Locked rows */}
                {lockedRows.length > 0 && (
                  <div className="relative">
                    <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
                      {lockedRows.map((inf, idx) => (
                        <LeaderboardRow key={inf.id} inf={inf} rank={idx + FREE_TIER_LIMIT + 1} locked />
                      ))}
                    </div>

                    {/* Upgrade overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(to bottom, color-mix(in oklch, var(--bg-2) 40%, transparent) 0%, color-mix(in oklch, var(--bg-2) 92%, transparent) 30%)" }}
                    >
                      <div
                        className="flex flex-col items-center gap-3 text-center mx-6 px-8 py-8"
                        style={{
                          backgroundColor: "var(--card)",
                          borderRadius: "1rem",
                          boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.10)",
                          maxWidth: 380,
                          width: "100%",
                        }}
                      >
                        <span style={{ fontSize: "2rem" }}>🔒</span>
                        <p className="text-base font-bold" style={{ color: "var(--ink)" }}>
                          Unlock Full Leaderboard
                        </p>
                        <p className="text-sm" style={{ color: "var(--ink-2)" }}>
                          See all {lockedRows.length + FREE_TIER_LIMIT} influencers, full stats and transparency scores
                        </p>
                        <button
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors mt-1"
                          style={{ backgroundColor: "var(--teal)" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-2)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal)")}
                        >
                          Upgrade to Pro — $9/mo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile-only hint */}
          <p
            className="md:hidden text-xs text-center"
            style={{ color: "var(--muted)" }}
          >
            View full stats on desktop
          </p>

        </div>
      </main>
    </div>
  );
}
