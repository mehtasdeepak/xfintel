"use client";

import { useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, var(--teal), #2563eb)",
  "linear-gradient(135deg, #fbbf24, #d97706)",
  "linear-gradient(135deg, #60a5fa, #2563eb)",
  "linear-gradient(135deg, #34d399, #059669)",
  "linear-gradient(135deg, #f472b6, #be185d)",
  "linear-gradient(135deg, #a78bfa, #6d28d9)",
  "linear-gradient(135deg, #fb923c, #c2410c)",
];

function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

export type Post = {
  id: string;
  content: string;
  category: string;
  sentiment: string | null;
  confidence: number | null;
  ticker_symbols: string[];
  posted_at: string;
  x_post_id: string;
  influencer: {
    x_handle: string;
    display_name: string;
    profile_image_url: string | null;
  } | null;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: 40, height: 40 }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: 40,
        height: 40,
        background: avatarGradient(name),
        color: "#fff",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}

function SentimentTag({ sentiment }: { sentiment: string }) {
  const map: Record<string, { icon: string; color: string }> = {
    bullish: { icon: "▲", color: "var(--up)" },
    bearish: { icon: "▼", color: "var(--down)" },
    neutral: { icon: "—", color: "var(--muted)" },
  };
  const { icon, color } = map[sentiment] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        color,
        gap: 4,
      }}
    >
      {icon} {sentiment.toUpperCase()}
    </span>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);

  const handle = post.influencer?.x_handle ?? "@unknown";
  const displayName = post.influencer?.display_name ?? "Unknown";
  const profileImage = post.influencer?.profile_image_url ?? null;
  const username = handle.replace(/^@/, "");
  const xUrl = `https://x.com/${username}/status/${post.x_post_id}`;
  const confidence = post.confidence != null ? Math.round(post.confidence * 100) : null;

  const sentimentBorderColor =
    post.sentiment === "bullish" ? "var(--up)" :
    post.sentiment === "bearish" ? "var(--down)" :
    "var(--muted)";

  return (
    <article
      className="flex flex-col gap-4"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--line)",
        borderLeft: `3px solid ${sentimentBorderColor}`,
        borderRadius: 14,
        padding: "20px 22px",
        transition: "box-shadow .2s ease",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
    >
      {/* Header: avatar + name/handle + timestamp */}
      <div className="flex items-center" style={{ gap: 12 }}>
        <Avatar src={profileImage} name={displayName} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ fontSize: 14.5, color: "var(--ink)" }}>
            {displayName}
          </p>
          <p
            className="truncate"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.5,
              color: "var(--muted)",
              marginTop: 2,
            }}
          >
            {handle}
          </p>
        </div>
        <p
          className="flex-shrink-0"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11.5,
            color: "var(--muted)",
          }}
        >
          {timeAgo(post.posted_at)}
        </p>
      </div>

      {/* Tags: category pill + sentiment + ticker chips */}
      <div className="flex items-center flex-wrap" style={{ gap: 6, marginBottom: "2px" }}>
        <CategoryBadge category={post.category as Parameters<typeof CategoryBadge>[0]["category"]} />
        {post.sentiment && <SentimentTag sentiment={post.sentiment} />}
        {post.ticker_symbols?.map((ticker) => (
          <span
            key={ticker}
            className="whitespace-nowrap"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--teal)",
              backgroundColor: "var(--teal-soft)",
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            ${ticker}
          </span>
        ))}
      </div>

      {/* Body */}
      <div>
        <p
          className={`whitespace-pre-wrap${!expanded ? " line-clamp-4" : ""}`}
          style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)" }}
        >
          {post.content}
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium"
          style={{ color: "var(--teal)" }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </div>

      {/* Footer: confidence + View on X */}
      <div
        className="flex items-center justify-between"
        style={{ fontSize: 12.5, color: "var(--muted)" }}
      >
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>
          {confidence != null && (
            <>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{confidence}%</span>
              {" AI confidence"}
            </>
          )}
        </span>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--teal)", fontWeight: 500 }}
        >
          View on X ↗
        </a>
      </div>
    </article>
  );
}
