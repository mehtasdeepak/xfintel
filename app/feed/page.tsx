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
          if (data?.picked_influencer_ids?.length > 0) {
            setPickedIds(data.picked_influencer_ids);
          }
        });
    });
  }, []);

  const fetchPosts = useCallback(
    async (filter: string, currentOffset: number, append: boolean, ids: string[] = []) => {
      try {
        const params = new URLSearchParams({
          limit: String(LIMIT),
          offset: String(currentOffset),
        });
        if (filter !== "all") params.set("category", filter);
        if (ids.length > 0) params.set("influencer_ids", ids.join(","));

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
    fetchPosts(activeFilter, 0, false, pickedIds).finally(() => setLoading(false));
  }, [activeFilter, fetchPosts, pickedIds]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(activeFilter, 0, false, pickedIds);
    }, 60_000);
    return () => clearInterval(interval);
  }, [activeFilter, fetchPosts, pickedIds]);

  const handleLoadMore = async () => {
    const nextOffset = offset + LIMIT;
    setLoadingMore(true);
    await fetchPosts(activeFilter, nextOffset, true, pickedIds);
    setOffset(nextOffset);
    setLoadingMore(false);
  };

  const handleFilterChange = (value: string) => {
    if (value === activeFilter) return;
    setActiveFilter(value);
    setPosts([]);
  };

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

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
        <div className="flex gap-8 px-6 py-8 max-w-[1100px] mx-auto">

          <div className="flex-1 min-w-0 max-w-[640px] flex flex-col gap-3 md:gap-6">
            <div className="flex flex-col gap-1 pt-4 md:pt-0">
              <h1 className="type-display text-[1.5rem] md:text-[2.5rem]" style={{ color: "var(--ink)" }}>
                Signal Feed
              </h1>
              <p className="type-body text-[0.875rem] md:text-[1rem]" style={{ color: "var(--ink-2)" }}>
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
                  <p className="type-label" style={{ color: "var(--ink-2)" }}>
                    Last updated {formattedTime}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a href="/onboarding" style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>
                ✦ Customize Feed
              </a>
            </div>

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
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? "var(--teal)" : "var(--card)",
                      color: isActive ? "#ffffff" : "var(--ink-2)",
                      border: isActive ? "1px solid var(--teal)" : "1px solid var(--line)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-soft)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)";
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl animate-pulse"
                    style={{ backgroundColor: "var(--line)" }}
                  />
                ))}
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
            )}
          </div>

          <div className="hidden xl:block flex-shrink-0" style={{ width: 300 }}>
            <div className="sticky" style={{ top: 56 + 32 }}>
              <RightPanel />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
