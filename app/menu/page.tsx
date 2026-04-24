"use client";

import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Bell,
  Lock,
  Plus,
  Settings,
  HelpCircle,
  Share2,
  LogOut,
} from "lucide-react";
import { signOut } from "@/components/UserMenu";

const MENU_ITEMS = [
  { icon: Bell,       label: "Notifications",       href: "#",                    external: false },
  { icon: Lock,       label: "Upgrade to Pro",       href: "#",                    external: false },
  { icon: Plus,       label: "Submit an Influencer", href: "#",                    external: false },
  { icon: Settings,   label: "Settings",             href: "#",                    external: false },
  { icon: HelpCircle, label: "Support",              href: "https://x.com/XFintelHQ", external: true },
  { icon: Share2,     label: "Share XFintel",        href: "#",                    external: false },
];

export default function MenuPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-2)" }}>

      {/* ── Profile header card ── */}
      <div
        className="flex flex-col items-center px-6 pt-14 pb-8 gap-4 relative"
        style={{ backgroundColor: "var(--teal)" }}
      >
        {/* Back link */}
        <Link
          href="/"
          className="absolute top-5 left-5 flex items-center gap-1 text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          <ChevronLeft size={16} />
          Back
        </Link>

        {/* Avatar */}
        <div
          className="rounded-full flex items-center justify-center font-bold text-white"
          style={{
            width: 80,
            height: 80,
            backgroundColor: "rgba(255,255,255,0.18)",
            fontSize: "2rem",
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          D
        </div>

        {/* Name */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-white font-semibold" style={{ fontSize: "1.25rem" }}>
            Deepak
          </p>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#ffffff" }}
          >
            Free Plan
          </span>
        </div>

        {/* Upgrade button */}
        <button
          className="mt-1 px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity active:opacity-75"
          style={{
            border: "1.5px solid rgba(255,255,255,0.55)",
            color: "#ffffff",
            backgroundColor: "transparent",
          }}
        >
          Upgrade to Pro
        </button>
      </div>

      {/* ── Menu items ── */}
      <div
        className="mx-4 mt-5 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          boxShadow: "0px 2px 12px rgba(23, 29, 27, 0.06)",
        }}
      >
        {MENU_ITEMS.map(({ icon: Icon, label, href, external }, idx) => (
          <a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="flex items-center gap-4 px-4 py-4 transition-colors active:bg-[var(--bg-2)]"
            style={{
              borderBottom: "1px solid var(--bg-2)",
              textDecoration: "none",
            }}
          >
            {/* Icon container */}
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 36, height: 36, backgroundColor: "var(--teal-soft)" }}
            >
              <Icon size={17} style={{ color: "var(--teal)" }} />
            </div>

            {/* Label */}
            <p className="flex-1 text-sm font-medium" style={{ color: "var(--ink)" }}>
              {label}
            </p>

            {/* Chevron */}
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </a>
        ))}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="flex items-center gap-4 px-4 py-4 w-full transition-colors active:bg-[#fff5f5]"
          style={{ border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, backgroundColor: "#fee2e2" }}
          >
            <LogOut size={17} style={{ color: "var(--down)" }} />
          </div>
          <p className="flex-1 text-sm font-medium" style={{ color: "var(--down)" }}>
            Sign out
          </p>
        </button>
      </div>

      {/* Version note */}
      <p
        className="text-center text-xs mt-8 mb-4"
        style={{ color: "var(--muted)" }}
      >
        XFintel · Free Plan
      </p>

    </div>
  );
}
