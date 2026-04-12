"use client";

import { useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import SentimentBadge from "@/components/SentimentBadge";

const CATEGORY_BORDER: Record<string, string> = {
  trade_call:      "#006859",
  analysis:        "#3d4946",
  performance:     "#7c3aed",
  watchlist:       "#d97706",
  portfolio:       "#0891b2",
  position_update: "#1a56db",
  exit:            "#b45309",
};

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

  return (
    <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover"
          style={{ width: 48, height: 48 }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-sm font-semibold text-white"
          style={{ width: 48, height: 48, backgroundColor: "#006859" }}
        >
          {initials}
        </div>
      )}
      {/* Verified-style green dot */}
      <span
        className="absolute bottom-0 right-0 rounded-full border-2 border-white"
        style={{ width: 10, height: 10, backgroundColor: "#006859" }}
      />
    </div>
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
  const borderColor = CATEGORY_BORDER[post.category] ?? "#e0ebe6";

  return (
    <article
      className="flex flex-col gap-3 p-6 rounded-2xl"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0px 12px 32px rgba(23, 29, 27, 0.06)",
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      {/* Row 1: Avatar + name + handle + time */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={profileImage} name={displayName} />
          <div className="min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "#171d1b" }}
            >
              {displayName}
            </p>
            <p className="text-[11px] truncate" style={{ color: "#3d4946", opacity: 0.75 }}>
              {handle}
            </p>
          </div>
        </div>
        <p
          className="text-xs flex-shrink-0"
          style={{ color: "#3d4946" }}
        >
          {timeAgo(post.posted_at)}
        </p>
      </div>

      {/* Row 2: Badges + tickers */}
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={post.category as Parameters<typeof CategoryBadge>[0]["category"]} />
        {post.sentiment && (
          <SentimentBadge sentiment={post.sentiment as Parameters<typeof SentimentBadge>[0]["sentiment"]} />
        )}
        {post.ticker_symbols?.map((ticker) => (
          <span
            key={ticker}
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#e0ebe6", color: "#171d1b" }}
          >
            ${ticker}
          </span>
        ))}
      </div>

      {/* Row 3: Post content with read-more toggle */}
      <div>
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            color: "#171d1b",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: expanded ? "unset" : 4,
            overflow: expanded ? "visible" : "hidden",
          }}
        >
          {post.content}
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium"
          style={{ color: "#006859" }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </div>

      {/* Row 4: Confidence + View on X */}
      <div className="flex items-center justify-between pt-1">
        <div>
          {confidence != null && (
            <p className="text-xs" style={{ color: "#3d4946" }}>
              {confidence}% confident
            </p>
          )}
        </div>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium transition-colors"
          style={{ color: "#006859" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#004d42")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#006859")
          }
        >
          View on X ↗
        </a>
      </div>
    </article>
  );
}
