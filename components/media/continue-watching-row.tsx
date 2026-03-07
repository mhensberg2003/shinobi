"use client";

import Link from "next/link";
import { useState } from "react";

type Item = {
  key: string;
  hash: string;
  fileIndex: string;
  title: string;
  currentTime: number;
  duration: number;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
};

export function ContinueWatchingRow() {
  const [items] = useState<Item[]>(() => {
    if (typeof window === "undefined") return [];
    const collected: Item[] = [];

    for (const [key, value] of Object.entries(window.localStorage)) {
      if (!key.startsWith("shinobi:watch:")) continue;

      try {
        const parsed = JSON.parse(value) as {
          title?: string;
          currentTime?: number;
          duration?: number;
          posterUrl?: string;
          episodeNumber?: number;
          episodeTotal?: number;
        };
        const [, , hash, fileIndex] = key.split(":");

        if (!hash || !fileIndex || !parsed.currentTime) continue;

        collected.push({
          key,
          hash,
          fileIndex,
          title: parsed.title || "Untitled",
          currentTime: parsed.currentTime,
          duration: parsed.duration || 0,
          posterUrl: parsed.posterUrl,
          episodeNumber: parsed.episodeNumber,
          episodeTotal: parsed.episodeTotal,
        });
      } catch {}
    }

    return collected.sort((a, b) => b.currentTime - a.currentTime).slice(0, 10);
  });

  if (!items.length) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Continue Watching</h2>
      {/* inline flex so it can never be overridden by a missing CSS class */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {items.map((item) => {
          const pct = item.duration > 0 ? Math.min(100, (item.currentTime / item.duration) * 100) : 0;
          return (
            <Link
              key={item.key}
              href={`/watch/${item.hash}?file=${item.fileIndex}`}
              className="cw-card"
              style={{ display: "block", width: 260, minWidth: 260, flexShrink: 0 }}
            >
              <div style={{ position: "relative", width: 260, height: 146, borderRadius: 10, overflow: "hidden", background: "#1e1e1e" }}>
                {item.posterUrl && (
                  <img src={item.posterUrl} alt={item.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)", zIndex: 1 }} />
                {item.episodeNumber != null && (
                  <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: "rgba(0,0,0,0.65)", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600, color: "#fff" }}>
                    {item.episodeTotal != null ? `${item.episodeNumber}/${item.episodeTotal}` : `Ep ${item.episodeNumber}`}
                  </div>
                )}
                <p style={{ position: "absolute", bottom: 18, left: 10, right: 10, zIndex: 2, fontSize: 12, fontWeight: 500, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{item.title}</p>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.15)", zIndex: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#e50914" }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
