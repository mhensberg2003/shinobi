"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WatchHistoryItem } from "@/app/api/watch-history/route";

export function ContinueWatchingRow() {
  const [items, setItems] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    fetch("/api/watch-history")
      .then((r) => r.json())
      .then((data: WatchHistoryItem[]) => setItems(data))
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold text-white mb-3">Continue Watching</h2>
      <div className="scroll-row">
        {items.map((item) => {
          const pct =
            item.durationSeconds > 0
              ? Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)
              : 0;
          const href = `/watch/resume/${encodeURIComponent(item.sessionKey)}`;

          return (
            <Link key={item.sessionKey} href={href} className="cw-card block shrink-0" style={{ width: 260, minWidth: 260 }}>
              <div className="relative rounded-[10px] overflow-hidden bg-[#1e1e1e]" style={{ width: 260, height: 146 }}>
                {item.posterUrl && (
                  <img src={item.posterUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                {item.episodeNumber != null && (
                  <div className="absolute top-2 right-2 z-[2] bg-black/65 rounded px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {item.episodeTotal != null
                      ? `${item.episodeNumber}/${item.episodeTotal}`
                      : `Ep ${item.episodeNumber}`}
                  </div>
                )}
                <p className="absolute bottom-[18px] left-2.5 right-2.5 z-[2] text-xs font-medium text-white truncate">
                  {item.title}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15 z-[2]">
                  <div className="h-full bg-[#e50914]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
