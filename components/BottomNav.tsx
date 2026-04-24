"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart2, LayoutGrid, Radio, TrendingUp } from "lucide-react";

const TABS = [
  { label: "Leaderboard", href: "/leaderboard", icon: BarChart2 },
  { label: "Portfolio",   href: "/portfolio",   icon: LayoutGrid  },
  { label: "Signals",     href: "/",            icon: Radio        },
  { label: "Trending",    href: "/trending",    icon: TrendingUp   },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/landing') return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
      style={{
        height: 64,
        backgroundColor: "#ffffff",
        boxShadow: "0px -2px 8px rgba(23, 29, 27, 0.06)",
      }}
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const color = isActive ? "#006859" : "#9eb3ae";

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            style={{ color }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
