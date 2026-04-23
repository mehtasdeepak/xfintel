"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/landing";
}

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const itemStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "10px 14px",
    fontSize: 13.5,
    color: "#171d1b",
    display: "block",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
        style={{ width: 34, height: 34, backgroundColor: "#006859" }}
        aria-label="User menu"
      >
        D
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 224,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            boxShadow: "0px 8px 24px rgba(23, 29, 27, 0.12)",
            border: "1px solid #e0ebe6",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {/* Email */}
          {email && (
            <div style={{ padding: "11px 14px", borderBottom: "1px solid #f0f4f2" }}>
              <p style={{ fontSize: 12, color: "#3d4946", wordBreak: "break-all" }}>{email}</p>
            </div>
          )}

          {/* Settings */}
          <button
            style={itemStyle}
            onClick={() => setOpen(false)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5fbf7")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Settings
          </button>

          {/* Support */}
          <a
            href="https://x.com/XFintelHQ"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              ...itemStyle,
              display: "block",
              textDecoration: "none",
              borderBottom: "1px solid #f0f4f2",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "#f5fbf7")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
            }
          >
            Support
          </a>

          {/* Sign out */}
          <button
            style={{ ...itemStyle, color: "#ba1a1a" }}
            onClick={signOut}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fff5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
