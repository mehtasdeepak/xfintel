"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Map, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Ticker = {
  ticker: string;
  mentions: number;
  dominant_sentiment: "bullish" | "bearish" | "neutral";
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  influencer_count: number;
  avg_confidence: number | null;
  price: number | null;
  price_change_percent: number | null;
};

function PriceDisplay({
  price,
  pct,
  size = "sm",
}: {
  price: number | null;
  pct: number | null;
  size?: "sm" | "lg";
}) {
  if (price === null) return null;
  const positive = pct !== null && pct >= 0;
  const pctColor = pct === null ? "#3d4946" : positive ? "#006859" : "#ba1a1a";
  const arrow = pct === null ? "" : positive ? "▲ " : "▼ ";
  const pctStr = pct !== null ? `${arrow}${positive ? "+" : ""}${pct.toFixed(2)}%` : null;

  return (
    <div className={`flex flex-col ${size === "lg" ? "items-start" : "items-end"} gap-0.5`}>
      <p
        className={size === "lg" ? "text-[1.25rem] md:text-[1.5rem]" : ""}
        style={{
          fontWeight: 700,
          fontSize: size === "lg" ? undefined : "0.875rem",
          color: "#171d1b",
          lineHeight: 1.1,
        }}
      >
        ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {pctStr && (
        <p style={{ fontSize: size === "lg" ? "1rem" : "0.75rem", fontWeight: size === "lg" ? 500 : 600, color: pctColor }}>
          {pctStr}
        </p>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_COLOR: Record<string, string> = {
  bullish: "#006859",
  bearish: "#ba1a1a",
  neutral: "#3d4946",
};

const SENTIMENT_ARROW: Record<string, string> = {
  bullish: "▲",
  bearish: "▼",
  neutral: "—",
};

// ─── Sparkline (decorative SVG placeholder) ───────────────────────────────────

function Sparkline() {
  return (
    <svg viewBox="0 0 220 56" fill="none" className="w-full" style={{ height: 56 }}>
      <path
        d="M0 44 C18 44 26 28 44 24 C62 20 70 36 90 30 C110 24 118 10 140 8 C158 6 172 18 192 14 C202 12 210 8 220 6"
        stroke="#006859"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 44 C18 44 26 28 44 24 C62 20 70 36 90 30 C110 24 118 10 140 8 C158 6 172 18 192 14 C202 12 210 8 220 6 L220 56 L0 56 Z"
        fill="url(#sparkGradient)"
        opacity="0.15"
      />
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#006859" />
          <stop offset="100%" stopColor="#006859" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Sentiment pill ───────────────────────────────────────────────────────────

function SentimentPill({ sentiment }: { sentiment: string }) {
  const color = SENTIMENT_COLOR[sentiment] ?? "#3d4946";
  const bg =
    sentiment === "bullish"
      ? "#dcfce7"
      : sentiment === "bearish"
      ? "#fee2e2"
      : "#e0ebe6";

  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase"
      style={{ backgroundColor: bg, color }}
    >
      {sentiment}
    </span>
  );
}

// ─── Featured card (rank 1) ───────────────────────────────────────────────────

function FeaturedCard({ ticker }: { ticker: Ticker }) {
  return (
    <div
      className="flex flex-col justify-between h-full rounded-2xl p-6 gap-4"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
        borderLeft: "4px solid #006859",
        minHeight: 280,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="type-label" style={{ color: "#3d4946" }}>
            #1 Most Mentioned · 7 days
          </p>
          <p
            className="text-[2.5rem] md:text-[3rem]"
            style={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "#171d1b",
            }}
          >
            ${ticker.ticker}
          </p>
          <PriceDisplay price={ticker.price} pct={ticker.price_change_percent} size="lg" />
        </div>
        <SentimentPill sentiment={ticker.dominant_sentiment} />
      </div>

      {/* Sparkline */}
      <div className="w-full">
        <Sparkline />
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2">
        <div
          className="flex flex-col items-center px-4 py-2.5 rounded-xl flex-1"
          style={{ backgroundColor: "#f5fbf7" }}
        >
          <p
            className="text-lg font-bold"
            style={{ color: "#006859" }}
          >
            {ticker.mentions}
          </p>
          <p className="type-label" style={{ color: "#3d4946" }}>
            Total Mentions
          </p>
        </div>
        <div
          className="flex flex-col items-center px-4 py-2.5 rounded-xl flex-1"
          style={{ backgroundColor: "#f5fbf7" }}
        >
          <p className="text-lg font-bold" style={{ color: "#006859" }}>
            {ticker.avg_confidence != null ? `${ticker.avg_confidence}%` : "—"}
          </p>
          <p className="type-label" style={{ color: "#3d4946" }}>
            Avg Confidence
          </p>
        </div>
        <div
          className="flex flex-col items-center px-4 py-2.5 rounded-xl flex-1"
          style={{ backgroundColor: "#f5fbf7" }}
        >
          <p className="text-lg font-bold" style={{ color: "#006859" }}>
            {ticker.influencer_count}
          </p>
          <p className="type-label" style={{ color: "#3d4946" }}>
            Influencers
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Side list (ranks 2–6) ────────────────────────────────────────────────────

function SideList({ tickers }: { tickers: Ticker[] }) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden h-full"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
      }}
    >
      <div className="px-5 py-3" style={{ backgroundColor: "#f5fbf7", borderBottom: "1px solid #e0ebe6" }}>
        <p className="type-label" style={{ color: "#3d4946" }}>Trending Now</p>
      </div>
      {tickers.map((t, idx) => {
        const arrow = SENTIMENT_ARROW[t.dominant_sentiment] ?? "—";
        const color = SENTIMENT_COLOR[t.dominant_sentiment] ?? "#3d4946";
        return (
          <div
            key={t.ticker}
            className="flex items-center gap-3 px-5 py-4 transition-colors"
            style={{ borderBottom: idx < tickers.length - 1 ? "1px solid #f5fbf7" : "none" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#fafcfb")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
          >
            <p className="text-xs font-bold w-5 flex-shrink-0" style={{ color: "#3d4946" }}>
              {String(idx + 2).padStart(2, "0")}
            </p>
            <span
              className="text-sm font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: "#eff5f2", color: "#006859" }}
            >
              ${t.ticker}
            </span>
            <p className="flex-1 text-xs" style={{ color: "#3d4946" }}>
              {t.mentions} mention{t.mentions !== 1 ? "s" : ""}
            </p>
            <span className="text-sm font-bold flex-shrink-0 mr-2" style={{ color }}>
              {arrow}
            </span>
            <PriceDisplay price={t.price} pct={t.price_change_percent} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Sentiment progress bar ───────────────────────────────────────────────────

function SentimentBar({ ticker }: { ticker: Ticker }) {
  const total = ticker.bullish_count + ticker.bearish_count + ticker.neutral_count;
  if (total === 0) return <div className="h-2 rounded-full w-full" style={{ backgroundColor: "#e0ebe6" }} />;

  const bullishPct = (ticker.bullish_count / total) * 100;
  const bearishPct = (ticker.bearish_count / total) * 100;
  const neutralPct = 100 - bullishPct - bearishPct;

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex h-2 rounded-full overflow-hidden flex-1">
        {bullishPct > 0 && (
          <div style={{ width: `${bullishPct}%`, backgroundColor: "#006859" }} />
        )}
        {neutralPct > 0 && (
          <div style={{ width: `${neutralPct}%`, backgroundColor: "#e0ebe6" }} />
        )}
        {bearishPct > 0 && (
          <div style={{ width: `${bearishPct}%`, backgroundColor: "#ba1a1a" }} />
        )}
      </div>
      <p className="text-xs flex-shrink-0 w-8 text-right" style={{ color: SENTIMENT_COLOR[ticker.dominant_sentiment] }}>
        {Math.round(bullishPct)}%
      </p>
    </div>
  );
}

// ─── Full ranked table ────────────────────────────────────────────────────────

function FullTable({ tickers }: { tickers: Ticker[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-3"
        style={{ backgroundColor: "#f5fbf7", borderBottom: "1px solid #e0ebe6" }}
      >
        <p className="type-label w-10 flex-shrink-0"                    style={{ color: "#3d4946" }}>Rank</p>
        <p className="type-label w-24"                                  style={{ color: "#3d4946" }}>Ticker</p>
        <p className="type-label w-[120px] text-right hidden md:block"  style={{ color: "#3d4946" }}>Price</p>
        <p className="type-label w-[100px] text-right hidden md:block"  style={{ color: "#3d4946" }}>24h Mentions</p>
        <p className="type-label flex-1 hidden md:block"                style={{ color: "#3d4946" }}>Influencer Sentiment</p>
        <p className="type-label w-16 text-center"                      style={{ color: "#3d4946" }}>Action</p>
      </div>

      {/* Rows */}
      {tickers.map((t, idx) => (
        <div
          key={t.ticker}
          className="flex items-center gap-4 px-5 py-4 transition-colors"
          style={{ borderBottom: "1px solid #f5fbf7" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#fafcfb")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
        >
          {/* Rank */}
          <p
            className="w-10 flex-shrink-0 text-sm font-bold"
            style={{ color: idx < 3 ? ["#f59e0b", "#9ca3af", "#b45309"][idx] : "#006859" }}
          >
            {String(idx + 1).padStart(2, "0")}
          </p>

          {/* Ticker */}
          <span
            className="w-24 text-sm font-bold px-2.5 py-1 rounded-full inline-block text-center"
            style={{ backgroundColor: "#eff5f2", color: "#006859" }}
          >
            ${t.ticker}
          </span>

          {/* Price */}
          <div className="w-[120px] hidden md:flex justify-end">
            <PriceDisplay price={t.price} pct={t.price_change_percent} />
          </div>

          {/* Mentions */}
          <p className="w-[100px] text-right text-sm font-medium hidden md:block" style={{ color: "#171d1b" }}>
            {t.mentions}
          </p>

          {/* Sentiment bar */}
          <div className="flex-1 hidden md:block">
            <SentimentBar ticker={t} />
          </div>

          {/* Action */}
          <div className="w-16 flex justify-center">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "#eff5f2", color: "#006859" }}
              title={`Add $${t.ticker} to watchlist`}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#006859") || ((e.currentTarget as HTMLElement).style.color = "#ffffff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#eff5f2") || ((e.currentTarget as HTMLElement).style.color = "#006859")}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const HEATMAP_COLOR: Record<string, string> = {
  bullish: "#006859",
  bearish: "#ba1a1a",
  neutral: "#9eb3ae",
};

function HeatmapLegend() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <p className="type-label" style={{ color: "#3d4946" }}>Sentiment Range</p>
          <div className="flex items-center gap-3">
            <div
              className="h-2 rounded-full"
              style={{
                width: 180,
                background: "linear-gradient(to right, #ba1a1a, #9eb3ae, #006859)",
              }}
            />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs" style={{ color: "#ba1a1a" }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#ba1a1a" }} />
                Bearish
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "#9eb3ae" }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#9eb3ae" }} />
                Neutral
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "#006859" }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#006859" }} />
                Bullish
              </span>
            </div>
          </div>
        </div>
        <p className="type-label" style={{ color: "#3d4946" }}>Square Size = Volume of Mentions (7 Days)</p>
      </div>
    </div>
  );
}

function HeatmapSquare({
  ticker,
  rank,
}: {
  ticker: Ticker;
  rank: number;
}) {
  const bg = HEATMAP_COLOR[ticker.dominant_sentiment] ?? "#9eb3ae";
  const isLarge = rank === 1;
  const isMedium = rank === 2 || rank === 3;

  const gridStyle: React.CSSProperties = {
    gridColumn: isLarge ? "span 2" : "span 1",
    gridRow: isLarge || isMedium ? "span 2" : "span 1",
    backgroundColor: bg,
    borderRadius: "1rem",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    cursor: "default",
    transition: "opacity 0.15s",
  };

  const pct = ticker.price_change_percent;
  const pctStr = pct !== null
    ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
    : null;

  return (
    <div
      style={gridStyle}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
    >
      {/* Background watermark rank */}
      <span
        style={{
          position: "absolute",
          bottom: -8,
          right: 8,
          fontSize: isLarge ? "6rem" : isMedium ? "5rem" : "3.5rem",
          fontWeight: 900,
          color: "rgba(255,255,255,0.08)",
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {rank}
      </span>

      {/* Top: ticker + sentiment */}
      <div className="flex flex-col gap-0.5">
        <p
          style={{
            fontSize: isLarge ? "1.75rem" : isMedium ? "1.375rem" : "1rem",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          ${ticker.ticker}
        </p>
        <p
          style={{
            fontSize: isLarge ? "0.75rem" : "0.65rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {ticker.dominant_sentiment}
        </p>
      </div>

      {/* Bottom: mentions + price change */}
      <div className="flex items-end justify-between gap-1">
        <p
          style={{
            fontSize: isLarge ? "0.8125rem" : "0.6875rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {ticker.mentions} mention{ticker.mentions !== 1 ? "s" : ""}
        </p>
        {pctStr && (
          <p
            style={{
              fontSize: isLarge ? "0.875rem" : "0.75rem",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {pct! >= 0 ? "▲" : "▼"} {pctStr}
          </p>
        )}
      </div>
    </div>
  );
}

function HeatmapGrid({ tickers }: { tickers: Ticker[] }) {
  // Slice to top 10 for the heatmap
  const items = tickers.slice(0, 10);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridAutoRows: "140px",
        gap: "0.75rem",
      }}
    >
      {items.map((t, idx) => (
        <HeatmapSquare key={t.ticker} ticker={t} rank={idx + 1} />
      ))}
    </div>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function FeaturedSkeleton() {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4 animate-pulse" style={{ backgroundColor: "#ffffff", boxShadow: "0px 12px 32px rgba(23,29,27,0.06)", minHeight: 280 }}>
      <div className="h-4 w-32 rounded" style={{ backgroundColor: "#e0ebe6" }} />
      <div className="h-12 w-40 rounded" style={{ backgroundColor: "#e0ebe6" }} />
      <div className="h-14 w-full rounded" style={{ backgroundColor: "#e0ebe6" }} />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="flex-1 h-14 rounded-xl" style={{ backgroundColor: "#e0ebe6" }} />)}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrendingPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"heatmap" | "grid">("grid");

  useEffect(() => {
    fetch("/api/trending-stocks")
      .then((r) => r.json())
      .then((d) => setTickers(d.tickers ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const featured = tickers[0] ?? null;
  const sideList = tickers.slice(1, 6);
  const allTickers = tickers;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f5fbf7" }}>
      <Sidebar />
      <TopNav />

      <main
        className="flex-1 md:ml-[220px] px-6"
        style={{ paddingTop: 56 + 32, paddingBottom: 48, minWidth: 0 }}
      >
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 pt-8 md:pt-0">
            <div className="flex flex-col gap-1">
              <p className="type-label" style={{ color: "#006859" }}>Market Intelligence</p>
              <h1 className="type-display" style={{ color: "#171d1b" }}>Trending Stocks</h1>
              <p className="type-body mt-1 max-w-lg" style={{ color: "#3d4946" }}>
                Real-time social sentiment analysis from your tracked financial influencers on X
              </p>
            </div>

            {/* View toggle */}
            <div
              className="flex items-center rounded-full p-1 flex-shrink-0 mt-2"
              style={{ backgroundColor: "#ffffff", border: "1px solid #e0ebe6" }}
            >
              <button
                onClick={() => setView("grid")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: view === "grid" ? "#006859" : "transparent",
                  color: view === "grid" ? "#ffffff" : "#3d4946",
                }}
              >
                <LayoutGrid size={13} />
                Grid View
              </button>
              <button
                onClick={() => setView("heatmap")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: view === "heatmap" ? "#006859" : "transparent",
                  color: view === "heatmap" ? "#ffffff" : "#3d4946",
                }}
              >
                <Map size={13} />
                Heatmap
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl p-6 text-sm" style={{ backgroundColor: "#ffffff", color: "#ba1a1a" }}>
              {error}
            </div>
          )}

          {/* ── Heatmap view ── */}
          {!error && view === "heatmap" && (
            <>
              {loading ? (
                <div className="rounded-2xl animate-pulse" style={{ backgroundColor: "#e0ebe6", height: 480 }} />
              ) : allTickers.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <HeatmapLegend />
                  <HeatmapGrid tickers={allTickers} />
                </div>
              ) : (
                <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: "#ffffff" }}>
                  <p className="text-sm" style={{ color: "#3d4946" }}>No ticker data in the last 7 days. Run the sync route first.</p>
                </div>
              )}
            </>
          )}

          {/* ── Grid view ── */}
          {!error && view === "grid" && (
            <>
              {/* Featured + side list */}
              <div className="flex flex-col md:flex-row gap-5" style={{ alignItems: "stretch" }}>
                {/* Top/Left — featured (full width on mobile, 60% on desktop) */}
                <div className="w-full md:flex-none" style={{ flex: "3", minWidth: 0 }}>
                  {loading || !featured ? (
                    <FeaturedSkeleton />
                  ) : (
                    <FeaturedCard ticker={featured} />
                  )}
                </div>

                {/* Bottom/Right — side list (full width on mobile, 40% on desktop) */}
                <div className="w-full md:flex-none" style={{ flex: "2", minWidth: 0 }}>
                  {loading ? (
                    <div className="rounded-2xl animate-pulse h-full" style={{ backgroundColor: "#e0ebe6", minHeight: 280 }} />
                  ) : sideList.length > 0 ? (
                    <SideList tickers={sideList} />
                  ) : null}
                </div>
              </div>

              {/* Full ranked table */}
              {!loading && allTickers.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="type-label" style={{ color: "#3d4946" }}>All Tickers · Last 7 Days</p>
                  <FullTable tickers={allTickers} />
                  <p
                    className="md:hidden text-xs text-center"
                    style={{ color: "#9eb3ae" }}
                  >
                    View full stats on desktop
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!loading && allTickers.length === 0 && (
                <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: "#ffffff" }}>
                  <p className="text-sm" style={{ color: "#3d4946" }}>No ticker data in the last 7 days. Run the sync route first.</p>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
