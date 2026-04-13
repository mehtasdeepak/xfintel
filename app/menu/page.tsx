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
} from "lucide-react";

const MENU_ITEMS = [
  { icon: Bell,       label: "Notifications",       href: "#" },
  { icon: Lock,       label: "Upgrade to Pro",       href: "#" },
  { icon: Plus,       label: "Submit an Influencer", href: "#" },
  { icon: Settings,   label: "Settings",             href: "#" },
  { icon: HelpCircle, label: "Support",              href: "#" },
  { icon: Share2,     label: "Share XFintel",        href: "#" },
];

export default function MenuPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5fbf7" }}>

      {/* ── Profile header card ── */}
      <div
        className="flex flex-col items-center px-6 pt-14 pb-8 gap-4 relative"
        style={{ backgroundColor: "#006859" }}
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
          backgroundColor: "#ffffff",
          boxShadow: "0px 2px 12px rgba(23, 29, 27, 0.06)",
        }}
      >
        {MENU_ITEMS.map(({ icon: Icon, label, href }, idx) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 px-4 py-4 transition-colors active:bg-[#f5fbf7]"
            style={{
              borderBottom: idx < MENU_ITEMS.length - 1 ? "1px solid #f5fbf7" : "none",
              textDecoration: "none",
            }}
          >
            {/* Icon container */}
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 36, height: 36, backgroundColor: "#eff5f2" }}
            >
              <Icon size={17} style={{ color: "#006859" }} />
            </div>

            {/* Label */}
            <p className="flex-1 text-sm font-medium" style={{ color: "#171d1b" }}>
              {label}
            </p>

            {/* Chevron */}
            <ChevronRight size={16} style={{ color: "#9eb3ae" }} />
          </Link>
        ))}
      </div>

      {/* Version note */}
      <p
        className="text-center text-xs mt-8 mb-4"
        style={{ color: "#9eb3ae" }}
      >
        XFintel · Free Plan
      </p>

    </div>
  );
}
