"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Trophy,
  TrendingUp,
  PieChart,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Signal Feed",  href: "/",            icon: Activity   },
  { label: "Leaderboard",  href: "/leaderboard", icon: Trophy     },
  { label: "Trending",     href: "/trending",    icon: TrendingUp },
  { label: "Portfolio",    href: "/portfolio",   icon: PieChart   },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors"
      style={{
        color: active ? "var(--teal)" : "var(--ink-2)",
        backgroundColor: active ? "var(--teal-soft)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.backgroundColor =
            "color-mix(in oklch, var(--teal) 6%, transparent)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6">
        <p className="text-xl font-bold" style={{ color: "var(--teal)" }}>
          XFintel
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--ink-2)" }}>
          X Financial Intelligence
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname === href}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-6 flex flex-col gap-4">
        {/* Upgrade card */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: "var(--teal)" }}
        >
          <div>
            <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              Unlock full leaderboard, performance history &amp; transparency
              scores
            </p>
          </div>
          <button
            className="w-full text-xs font-semibold py-2 rounded-lg transition-colors"
            style={{ backgroundColor: "var(--card)", color: "var(--teal)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--line)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)")
            }
          >
            Get Access
          </button>
        </div>

      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40"
        style={{
          width: "220px",
          backgroundColor: "var(--card)",
          borderRight: "1px solid var(--line)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger, backdrop and drawer are intentionally removed.
          Mobile navigation is handled by BottomNav. */}
    </>
  );
}
