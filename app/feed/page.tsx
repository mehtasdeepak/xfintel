"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Search, Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PostCard, { type Post } from "@/components/PostCard";
import RightPanel from "@/components/RightPanel";
import UserMenu from "@/components/UserMenu";

const LIMIT = 20;

const FILTERS: { label: string; value: string }[] = [
  { label: "All",             value: "all"             },
  { label: "Trade Call",      value: "trade_call"      },
  { label: "Analysis",        value: "analysis"        },
  { label: "Watchlist",       value: "watchlist"       },
  { label: "Performance",     value: "performance"     },
  { label: "Portfolio",       value: "portfolio"       },
  { label: "Position Update", value: "position_update" },
  { label: "Exit",            value: "exit"            },
];

const TABLE_TABS = [
  { label: "All",              value: "all"             },
  { label: "Trade Calls",      value: "trade_call"      },
  { label: "Analysis",         value: "analysis"        },
  { label: "Watchlist",        value: "watchlist"       },
  { label: "Position Updates", value: "position_update" },
  { label: "Exits",            value: "exit"            },
];

const AVATAR_GRADS = [
  "linear-gradient(135deg,#fbbf24,#d97706)",
  "linear-gradient(135deg,#60a5fa,#2563eb)",
  "linear-gradient(135deg,#34d399,#059669)",
  "linear-gradient(135deg,#f472b6,#be185d)",
  "linear-gradient(135deg,#a78bfa,#6d28d9)",
  "linear-gradient(135deg,#fb923c,#c2410c)",
];

function SkeletonCard() {
  return (
    <div style={{ backgroundColor: "var(--card)", border: "1px solid var(--line)",
      borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="animate-pulse" style={{ width: 40, height: 40,
          borderRadius: "50%", backgroundColor: "var(--line)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="animate-pulse" style={{ height: 14, width: "40%",
            backgroundColor: "var(--line)", borderRadius: 4 }} />
          <div className="animate-pulse" style={{ height: 12, width: "25%",
            backgroundColor: "var(--line)", borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="animate-pulse" style={{ height: 13, width: "100%",
          backgroundColor: "var(--line)", borderRadius: 4 }} />
        <div className="animate-pulse" style={{ height: 13, width: "85%",
          backgroundColor: "var(--line)", borderRadius: 4 }} />
        <div className="animate-pulse" style={{ height: 13, width: "70%",
          backgroundColor: "var(--line)", borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function SignalFeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [timeRange, setTimeRange] = useState(30);
  const [tableTab, setTableTab] = useState("all");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('user_profiles')
        .select('picked_influencer_ids')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.picked_influencer_ids && data.picked_influencer_ids.length > 0) {
            setPickedIds(data.picked_influencer_ids);
          }
        });
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("xfintel.viewMode");
    if (saved === "table" || saved === "card") setViewMode(saved);
  }, []);

  const fetchPosts = useCallback(
    async (filter: string, currentOffset: number, append: boolean, ids: string[] = [], days?: number) => {
      try {
        const params = new URLSearchParams({
          limit: String(LIMIT),
          offset: String(currentOffset),
        });
        if (filter !== "all") params.set("category", filter);
        if (ids.length > 0) params.set("influencer_ids", ids.join(","));
        if (days && days > 0) params.set("days", String(days));

        const res = await fetch(`/api/feed?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = await res.json();
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setHasMore(data.has_more);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOffset(0);
    fetchPosts(activeFilter, 0, false, pickedIds, viewMode === "table" ? timeRange : undefined).finally(() => setLoading(false));
  }, [activeFilter, fetchPosts, pickedIds, viewMode, timeRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(activeFilter, 0, false, pickedIds, viewMode === "table" ? timeRange : undefined);
    }, 60_000);
    return () => clearInterval(interval);
  }, [activeFilter, fetchPosts, pickedIds, viewMode, timeRange]);

  const handleLoadMore = async () => {
    const nextOffset = offset + LIMIT;
    setLoadingMore(true);
    await fetchPosts(activeFilter, nextOffset, true, pickedIds, viewMode === "table" ? timeRange : undefined);
    setOffset(nextOffset);
    setLoadingMore(false);
  };

  const handleFilterChange = (value: string) => {
    if (value === activeFilter) return;
    setActiveFilter(value);
    setPosts([]);
  };

  const toggleView = (mode: "card" | "table") => {
    setViewMode(mode);
    localStorage.setItem("xfintel.viewMode", mode);
  };

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const countByCategory = posts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-2)" }}>
      <Sidebar />

      <header
        className="fixed top-0 right-0 md:left-[220px] left-0 z-30 flex items-center justify-between gap-4 px-6"
        style={{
          height: 56,
          backgroundColor: "var(--card)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 rounded-full"
          style={{ width: 320, height: 36, backgroundColor: "var(--teal-soft)" }}
        >
          <Search size={15} style={{ color: "var(--ink-2)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search signals, tickers..."
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
            style={{ color: "var(--ink)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-full transition-colors"
            style={{ color: "var(--ink-2)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-soft)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
            }
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          {/* Mobile: link to /menu */}
          <Link
            href="/menu"
            className="md:hidden rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
            style={{ width: 34, height: 34, backgroundColor: "var(--teal)" }}
          >
            D
          </Link>

          {/* Desktop: dropdown */}
          <div className="hidden md:block">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 md:ml-[220px]" style={{ paddingTop: 56, minWidth: 0 }}>
        {/* Page header — outside the two-column grid */}
        <div className="px-6 pt-8 pb-4 max-w-[1100px] mx-auto flex flex-col">
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "var(--teal)",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            fontWeight: 500,
            marginBottom: 8,
          }}>Real-time accountability</p>
          <h1 style={{ fontSize: "34px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", margin: "0 0 8px" }}>
            Signal Feed
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ink-2)", lineHeight: 1.55 }}>
            Real-time accountability for financial influencers
          </p>
          {formattedTime && (
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex" style={{ width: 8, height: 8 }}>
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ backgroundColor: "var(--teal)" }}
                />
                <span
                  className="relative inline-flex rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: "var(--teal)" }}
                />
              </span>
              <p className="type-label" style={{ color: "var(--up)" }}>
                {`LIVE · LAST UPDATED ${formattedTime}`}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-8 px-6 pb-8 max-w-[1100px] mx-auto">

          <div
            className="flex-1 min-w-0 flex flex-col gap-3 md:gap-6"
            style={{ maxWidth: viewMode === "table" ? "none" : 640 }}
          >
            {/* Toolbar: customize link + view toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <a href="/onboarding" style={{ fontSize: "12px", color: "var(--muted)" }}>
                ✦ Customize Feed
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {viewMode === "table" && (
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(Number(e.target.value))}
                    style={{
                      fontSize: "13px", padding: "4px 10px", borderRadius: 8,
                      border: "1px solid var(--line)", backgroundColor: "var(--card)",
                      color: "var(--ink)", marginRight: 8,
                    }}
                  >
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                    <option value={0}>All Time</option>
                  </select>
                )}
                <div style={{
                  display: "flex", gap: 4, padding: 4,
                  backgroundColor: "var(--card)", border: "1px solid var(--line)", borderRadius: 8,
                }}>
                  <button
                    onClick={() => toggleView("card")}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "none",
                      cursor: "pointer", fontSize: 12,
                      backgroundColor: viewMode === "card" ? "var(--teal)" : "transparent",
                      color: viewMode === "card" ? "#fff" : "var(--muted)",
                    }}
                  >
                    ⊞ Cards
                  </button>
                  <button
                    onClick={() => toggleView("table")}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "none",
                      cursor: "pointer", fontSize: 12,
                      backgroundColor: viewMode === "table" ? "var(--teal)" : "transparent",
                      color: viewMode === "table" ? "#fff" : "var(--muted)",
                    }}
                  >
                    ☰ Table
                  </button>
                </div>
              </div>
            </div>

            {/* Filter chips */}
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
              {FILTERS.map(({ label, value }) => {
                const isActive = activeFilter === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleFilterChange(value)}
                    className="transition-colors"
                    style={{
                      padding: "8px 14px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      backgroundColor: isActive ? "var(--teal)" : "var(--card)",
                      color: isActive ? "#fff" : "var(--ink-2)",
                      border: isActive ? "1px solid var(--teal)" : "1px solid var(--line-2)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)";
                    }}
                  >
                    {label}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      opacity: isActive ? 0.85 : 0.7,
                      marginLeft: 4,
                    }}>
                      {value === "all" ? posts.length : (countByCategory[value] || 0)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Card view */}
            {viewMode === "card" && (
              loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : error ? (
                <div
                  className="rounded-2xl p-6 text-sm"
                  style={{ backgroundColor: "var(--card)", color: "var(--down)" }}
                >
                  {error}
                </div>
              ) : posts.length === 0 ? (
                <div
                  className="rounded-2xl p-10 text-center"
                  style={{ backgroundColor: "var(--card)" }}
                >
                  <p className="text-sm" style={{ color: "var(--ink-2)" }}>
                    No posts found for this filter.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full py-3 rounded-2xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: "var(--card)",
                        color: loadingMore ? "var(--ink-2)" : "var(--teal)",
                        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
                      }}
                    >
                      {loadingMore ? "Loading…" : "Load More"}
                    </button>
                  )}
                </div>
              )
            )}

            {/* Table view */}
            {viewMode === "table" && (
              <div style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                overflow: "hidden",
              }}>
                {/* Tabs row */}
                <div style={{
                  display: "flex", gap: 0,
                  borderBottom: "1px solid var(--line)",
                  overflowX: "auto", padding: "0 4px",
                }}>
                  {TABLE_TABS.map((tab) => {
                    const count = tab.value === "all"
                      ? posts.length
                      : posts.filter((p) => p.category === tab.value).length;
                    const isActive = tableTab === tab.value;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setTableTab(tab.value)}
                        style={{
                          padding: "12px 16px", border: "none",
                          borderBottom: isActive ? "2px solid var(--teal)" : "2px solid transparent",
                          backgroundColor: "transparent", cursor: "pointer",
                          fontSize: "13px", fontWeight: isActive ? 600 : 400,
                          color: isActive ? "var(--teal)" : "var(--muted)",
                          whiteSpace: "nowrap", marginBottom: -1,
                        }}
                      >
                        {tab.label}
                        <span style={{
                          marginLeft: 6, fontSize: "11px",
                          fontFamily: "'JetBrains Mono',monospace",
                          opacity: 0.7,
                        }}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Table header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "120px 200px 90px 110px 1fr 100px",
                  padding: "10px 16px",
                  backgroundColor: "var(--bg-2)",
                  borderBottom: "1px solid var(--line)",
                }}>
                  {["DATE", "INFLUENCER", "TICKER", "SENTIMENT", "SIGNAL", "ACTION"].map((col) => (
                    <span key={col} style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: "10.5px", letterSpacing: "0.1em",
                      color: "var(--muted)", fontWeight: 500,
                    }}>
                      {col}
                    </span>
                  ))}
                </div>

                {/* Table rows */}
                {loading ? (
                  <div className="flex flex-col">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} style={{
                        display: "grid",
                        gridTemplateColumns: "120px 200px 90px 110px 1fr 100px",
                        padding: "12px 16px", gap: 8,
                        borderBottom: "1px solid var(--line)",
                      }}>
                        {[80, 140, 60, 80, 200, 70].map((w, j) => (
                          <div key={j} className="animate-pulse rounded"
                            style={{ height: 16, width: w, backgroundColor: "var(--line)" }} />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {(tableTab === "all" ? posts : posts.filter((p) => p.category === tableTab))
                      .map((post, idx, arr) => {
                        const handle = post.influencer?.x_handle ?? "";
                        const username = handle.replace(/^@/, "");
                        const tweetUrl = `https://x.com/${username}/status/${post.x_post_id}`;
                        const initials = (post.influencer?.display_name ?? "?")
                          .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                        const grad = AVATAR_GRADS[(initials.charCodeAt(0) ?? 0) % AVATAR_GRADS.length];
                        const sentColor = post.sentiment === "bullish" ? "var(--up)"
                          : post.sentiment === "bearish" ? "var(--down)" : "var(--muted)";
                        const sentIcon = post.sentiment === "bullish" ? "▲"
                          : post.sentiment === "bearish" ? "▼" : "—";

                        return (
                          <div
                            key={post.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "120px 200px 90px 110px 1fr 100px",
                              padding: "12px 16px", alignItems: "center",
                              borderBottom: idx < arr.length - 1 ? "1px solid var(--line)" : "none",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-2)"}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                          >
                            {/* Date */}
                            <span style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: "12px", color: "var(--muted)",
                            }}>
                              {new Date(post.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>

                            {/* Influencer */}
                            <a href={`/influencer/${username}`}
                              style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                              {post.influencer?.profile_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={post.influencer.profile_image_url}
                                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                                  alt="" />
                              ) : (
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%",
                                  background: grad, display: "flex", alignItems: "center",
                                  justifyContent: "center", fontSize: "11px",
                                  fontWeight: 600, color: "#fff", flexShrink: 0,
                                }}>
                                  {initials}
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <p style={{
                                  fontSize: "13px", fontWeight: 600, color: "var(--ink)",
                                  margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}>
                                  {post.influencer?.display_name ?? username}
                                </p>
                                <p style={{
                                  fontSize: "11px", color: "var(--muted)", margin: 0,
                                  fontFamily: "'JetBrains Mono',monospace",
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}>
                                  {handle}
                                </p>
                              </div>
                            </a>

                            {/* Ticker */}
                            <span style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: "12px", fontWeight: 600, color: "var(--teal)",
                              backgroundColor: "var(--teal-soft)", padding: "3px 8px",
                              borderRadius: 6, whiteSpace: "nowrap",
                              overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {post.ticker_symbols?.[0] ? `$${post.ticker_symbols[0]}` : "—"}
                            </span>

                            {/* Sentiment */}
                            <span style={{
                              fontSize: "12px", fontWeight: 600, color: sentColor,
                              fontFamily: "'JetBrains Mono',monospace",
                            }}>
                              {sentIcon} {(post.sentiment ?? "neutral").toUpperCase()}
                            </span>

                            {/* Signal */}
                            <span style={{
                              fontSize: "13px", color: "var(--ink-2)",
                              overflow: "hidden", textOverflow: "ellipsis",
                              whiteSpace: "nowrap", paddingRight: 16,
                            }}>
                              {post.content.slice(0, 80)}{post.content.length > 80 ? "…" : ""}
                            </span>

                            {/* Action */}
                            <a
                              href={tweetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex", alignItems: "center",
                                gap: 4, fontSize: "12px", fontWeight: 500,
                                color: "var(--teal)", padding: "5px 10px",
                                border: "1px solid var(--line)", borderRadius: 8,
                                textDecoration: "none", whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-soft)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                            >
                              View on X ↗
                            </a>
                          </div>
                        );
                      })}

                    {/* Load more */}
                    {hasMore && (
                      <div style={{ padding: "16px", textAlign: "center", borderTop: "1px solid var(--line)" }}>
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          style={{
                            fontSize: "13px", color: "var(--teal)",
                            fontWeight: 500, background: "none", border: "none", cursor: "pointer",
                          }}
                        >
                          {loadingMore ? "Loading…" : "Load 25 more →"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="hidden xl:block flex-shrink-0" style={{ width: 300 }}>
            <div className="sticky" style={{ top: 80 }}>
              <RightPanel />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
