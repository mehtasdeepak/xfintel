type Category =
  | "trade_call"
  | "position_update"
  | "exit"
  | "performance"
  | "portfolio"
  | "watchlist"
  | "analysis"
  | "noise";

const CONFIG: Record<Category, { label: string; bg: string; color: string }> = {
  trade_call:      { label: "Trade Call 🎯",      bg: "#006859", color: "#ffffff" },
  position_update: { label: "Position Update 🔄", bg: "#1a56db", color: "#ffffff" },
  exit:            { label: "Exit 🚪",            bg: "#b45309", color: "#ffffff" },
  performance:     { label: "Performance 📈",     bg: "#7c3aed", color: "#ffffff" },
  portfolio:       { label: "Portfolio 🗂️",       bg: "#0891b2", color: "#ffffff" },
  watchlist:       { label: "Watchlist 👀",       bg: "#d97706", color: "#ffffff" },
  analysis:        { label: "Analysis 📊",        bg: "#3d4946", color: "#ffffff" },
  noise:           { label: "Noise 🔇",           bg: "#e0ebe6", color: "#171d1b" },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, bg, color } = CONFIG[category] ?? CONFIG.noise;

  return (
    <span
      className="type-label inline-flex items-center px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}
