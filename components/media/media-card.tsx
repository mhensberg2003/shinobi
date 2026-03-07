import Link from "next/link";
import { getMediaHref } from "@/lib/media/catalog";
import type { MediaSearchItem } from "@/lib/media/types";

const W = 175;
const H = Math.round(W * 1.5); // 263px

export function MediaCard({ item }: { item: MediaSearchItem }) {
  return (
    <Link
      href={getMediaHref(item)}
      className="media-card"
      style={{ display: "block", width: W, minWidth: W, flexShrink: 0 }}
    >
      <div style={{ position: "relative", width: W, height: H, borderRadius: 10, overflow: "hidden", background: "#1e1e1e" }}>
        {item.posterUrl && (
          <img
            src={item.posterUrl}
            alt={item.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)" }} />
        <p style={{
          position: "absolute", bottom: 10, left: 10, right: 10,
          fontSize: 12, fontWeight: 600, color: "#fff",
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          lineHeight: "1.35",
        }}>{item.title}</p>
      </div>
    </Link>
  );
}
