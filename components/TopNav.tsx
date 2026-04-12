"use client";

import { Search, Bell } from "lucide-react";

export default function TopNav() {
  return (
    <header
      className="fixed top-0 right-0 md:left-[220px] left-0 z-30 flex items-center justify-between gap-4 px-6"
      style={{
        height: 56,
        backgroundColor: "#ffffff",
        boxShadow: "0px 2px 8px rgba(23, 29, 27, 0.06)",
      }}
    >
      <div
        className="flex items-center gap-2 px-4 rounded-full"
        style={{ width: 320, height: 36, backgroundColor: "#eff5f2" }}
      >
        <Search size={15} style={{ color: "#3d4946", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search signals, tickers..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: "#171d1b" }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-full transition-colors"
          style={{ color: "#3d4946" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "#eff5f2")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
          }
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
        <div
          className="rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
          style={{ width: 34, height: 34, backgroundColor: "#006859" }}
        >
          D
        </div>
      </div>
    </header>
  );
}
