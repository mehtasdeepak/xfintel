"use client";

import { useEffect, useState } from "react";

type TrendingTicker = {
  ticker: string;
  mentions: number;
  sentiment: "bullish" | "bearish" | "neutral";
};

type TopInfluencer = {
  x_handle: string;
  display_name: string;
  profile_image_url: string | null;
  signal_count: number;
  win_rate: number | null;
};

const SENTIMENT_ICON: Record<string, { icon: string; color: string }> = {
  bullish: { icon: "▲", color: "#006859" },
  bearish: { icon: "▼", color: "#ba1a1a" },
  neutral: { icon: "—", color: "#3d4946" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-label mb-3" style={{ color: "#3d4946" }}>
      {children}
    </p>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-12 h-6 rounded-full animate-pulse" style={{ backgroundColor: "#e0ebe6" }} />
      <div className="flex-1 h-4 rounded animate-pulse" style={{ backgroundColor: "#e0ebe6" }} />
      <div className="w-6 h-4 rounded animate-pulse" style={{ backgroundColor: "#e0ebe6" }} />
    </div>
  );
}

export default function RightPanel() {
  const [tickers, setTickers] = useState<TrendingTicker[]>([]);
  const [topInfluencer, setTopInfluencer] = useState<TopInfluencer | null>(null);
  const [loadingTickers, setLoadingTickers] = useState(true);
  const [loadingInfluencer, setLoadingInfluencer] = useState(true);

  useEffect(() => {
    fetch("/api/trending-tickers")
      .then((r) => r.json())
      .then((d) => setTickers(d.tickers ?? []))
      .finally(() => setLoadingTickers(false));

    fetch("/api/top-influencer")
      .then((r) => r.json())
      .then(async (d) => {
        const inf = d.influencer ?? null;
        if (!inf) return setTopInfluencer(null);

        // Fetch win rate for this influencer
        const statsRes = await fetch(
          `/api/influencer-stats?handle=${encodeURIComponent(inf.x_handle)}`
        );
        const stats = statsRes.ok ? await statsRes.json() : {};
        setTopInfluencer({ ...inf, win_rate: stats.win_rate ?? null });
      })
      .finally(() => setLoadingInfluencer(false));
  }, []);

  const handle = topInfluencer?.x_handle ?? "";
  const username = handle.replace(/^@/, "");
  const initials = (topInfluencer?.display_name ?? "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
      }}
    >

      {/* Section 1 — Trending Signals */}
      <div className="p-5">
        <SectionLabel>Trending Signals · 24h</SectionLabel>

        {loadingTickers ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : tickers.length === 0 ? (
          <p className="text-sm" style={{ color: "#3d4946" }}>
            No ticker data yet.
          </p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "#f5fbf7" }}>
            {tickers.map((t) => {
              const { icon, color } = SENTIMENT_ICON[t.sentiment] ?? SENTIMENT_ICON.neutral;
              return (
                <div key={t.ticker} className="flex items-center gap-3 py-2.5">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#eff5f2", color: "#006859" }}
                  >
                    ${t.ticker}
                  </span>
                  <span
                    className="flex-1 text-xs"
                    style={{ color: "#3d4946" }}
                  >
                    {t.mentions} mention{t.mentions !== 1 ? "s" : ""}
                  </span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color }}>
                    {icon}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "#eff5f2" }} />

      {/* Section 2 — Weekly Top Influencer */}
      <div className="p-5">
        <SectionLabel>Weekly Top Influencer</SectionLabel>

        {loadingInfluencer ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: "#e0ebe6" }} />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-4 rounded w-3/4 animate-pulse" style={{ backgroundColor: "#e0ebe6" }} />
                <div className="h-3 rounded w-1/2 animate-pulse" style={{ backgroundColor: "#e0ebe6" }} />
              </div>
            </div>
          </div>
        ) : !topInfluencer ? (
          <p className="text-sm" style={{ color: "#3d4946" }}>
            No data yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {topInfluencer.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={topInfluencer.profile_image_url}
                  alt={topInfluencer.display_name}
                  className="rounded-full object-cover flex-shrink-0"
                  style={{ width: 40, height: 40 }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white"
                  style={{ width: 40, height: 40, backgroundColor: "#006859" }}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#171d1b" }}>
                  {topInfluencer.display_name}
                </p>
                <p className="text-xs" style={{ color: "#3d4946" }}>
                  {handle}
                </p>
              </div>
            </div>

            <div
              className="flex gap-2 rounded-xl p-3"
              style={{ backgroundColor: "#f5fbf7" }}
            >
              <div className="flex flex-col items-center flex-1">
                <p className="text-lg font-bold" style={{ color: "#006859" }}>
                  {topInfluencer.signal_count}
                </p>
                <p className="type-label" style={{ color: "#3d4946" }}>
                  Signals
                </p>
              </div>
              <div style={{ width: 1, backgroundColor: "#e0ebe6" }} />
              <div className="flex flex-col items-center flex-1">
                <p className="text-lg font-bold" style={{ color: "#006859" }}>
                  {topInfluencer.win_rate != null ? `${topInfluencer.win_rate}%` : "—"}
                </p>
                <p className="type-label" style={{ color: "#3d4946" }}>
                  Win Rate
                </p>
              </div>
            </div>

            <a
              href={`https://x.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors block"
              style={{ backgroundColor: "#171d1b", color: "#ffffff" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#004d42")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#171d1b")
              }
            >
              View Full Performance
            </a>
          </div>
        )}
      </div>

    </aside>
  );
}
