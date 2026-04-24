"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export default function TopNav() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{influencers: any[], tickers: any[]}>({influencers: [], tickers: []});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults({influencers:[], tickers:[]}); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 md:left-[220px] left-0 z-30 flex items-center justify-between gap-4 px-6"
      style={{
        height: 56,
        backgroundColor: "var(--card)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div ref={ref} className="relative">
        <div
          className="flex items-center gap-2 px-4 rounded-full"
          style={{ width: 320, height: 36, backgroundColor: "var(--bg-2)" }}
        >
          <Search size={15} style={{ color: "var(--ink-2)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search signals, tickers..."
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
            style={{ color: "var(--ink)" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {open && (results.influencers.length > 0 || results.tickers.length > 0) && (
          <div className="absolute top-full mt-2 left-0 w-full rounded-xl overflow-hidden z-50"
            style={{backgroundColor:"var(--card)", boxShadow:"0px 8px 24px rgba(23,29,27,0.12)", border:"1px solid var(--line)"}}>
            {results.influencers.length > 0 && (
              <div>
                <p style={{fontSize:"10px", fontWeight:600, letterSpacing:"0.1em", color:"var(--muted)", padding:"8px 16px 4px"}}>INFLUENCERS</p>
                {results.influencers.map((inf: any) => (
                  <div key={inf.id} onClick={() => { router.push(`/influencer/${inf.x_handle.replace(/^@/,"")}`); setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                    style={{color:"var(--ink)", fontSize:"13px"}}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor="var(--bg-2)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                      style={{backgroundColor:"var(--teal)"}}>
                      {inf.display_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{fontWeight:500}}>{inf.display_name}</p>
                      <p style={{fontSize:"11px", color:"var(--muted)"}}>{inf.x_handle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {results.tickers.length > 0 && (
              <div style={{borderTop: results.influencers.length > 0 ? "1px solid var(--line)" : "none"}}>
                <p style={{fontSize:"10px", fontWeight:600, letterSpacing:"0.1em", color:"var(--muted)", padding:"8px 16px 4px"}}>TICKERS</p>
                {results.tickers.map((t: any) => (
                  <div key={t.ticker} onClick={() => { router.push(`/trending?ticker=${t.ticker}`); setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                    style={{color:"var(--ink)", fontSize:"13px"}}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor="var(--bg-2)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{backgroundColor:"var(--bg-2)", color:"var(--teal)"}}>$</div>
                    <p style={{fontWeight:500}}>${t.ticker}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-full transition-colors"
          style={{ color: "var(--ink-2)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-2)")
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
  );
}
