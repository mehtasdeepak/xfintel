type Sentiment = "bullish" | "bearish" | "neutral";

const CONFIG: Record<Sentiment, { icon: string; color: string }> = {
  bullish: { icon: "▲", color: "#006859" },
  bearish: { icon: "▼", color: "#ba1a1a" },
  neutral: { icon: "—", color: "#3d4946" },
};

export default function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const { icon, color } = CONFIG[sentiment] ?? CONFIG.neutral;

  return (
    <span
      className="type-label inline-flex items-center gap-1"
      style={{ color }}
    >
      {icon} {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </span>
  );
}
