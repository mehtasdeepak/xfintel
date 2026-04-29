type Category =
  | "trade_call"
  | "position_update"
  | "exit"
  | "performance"
  | "portfolio"
  | "watchlist"
  | "analysis"
  | "noise";

const CONFIG: Record<Category, { label: string; icon: string; bg: string; color: string }> = {
  trade_call:      { label: "TRADE CALL",      icon: "⚡", bg: "#fef3c7", color: "#92400e" },
  position_update: { label: "POSITION UPDATE", icon: "◆", bg: "#dbeafe", color: "#1e40af" },
  exit:            { label: "EXIT",            icon: "⊗", bg: "#fce7f3", color: "#9d174d" },
  performance:     { label: "PERFORMANCE",     icon: "▲", bg: "#ede9fe", color: "#5b21b6" },
  portfolio:       { label: "PORTFOLIO",       icon: "◈", bg: "#e0f2fe", color: "#075985" },
  watchlist:       { label: "WATCHLIST",       icon: "☆", bg: "#fed7aa", color: "#9a3412" },
  analysis:        { label: "ANALYSIS",        icon: "⊙", bg: "#ecfeff", color: "#0e7490" },
  noise:           { label: "NOISE",           icon: "⊘", bg: "#f1f5f9", color: "#64748b" },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, icon, bg, color } = CONFIG[category] ?? CONFIG.noise;

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{
        backgroundColor: bg,
        color,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10.5px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        borderRadius: 6,
        padding: "4px 10px",
      }}
    >
      {icon} {label}
    </span>
  );
}
