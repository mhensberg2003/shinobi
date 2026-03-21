"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

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
  sessionKey?: string;
};

const EMPTY_ITEMS: Item[] = [];
let cachedSignature = "";
let cachedItems: Item[] = EMPTY_ITEMS;

function readContinueWatchingItems(): Item[] {
  if (typeof window === "undefined") return EMPTY_ITEMS;

  const collected: Item[] = [];

  for (const [key, value] of Object.entries(window.localStorage)) {
    if (!key.startsWith("shinobi:watch:") && !key.startsWith("shinobi:watch-session:")) continue;

    try {
      const parsed = JSON.parse(value) as {
        title?: string;
        currentTime?: number;
        duration?: number;
        posterUrl?: string;
        episodeNumber?: number;
        episodeTotal?: number;
        sessionKey?: string;
      };
      const parts = key.split(":");
      const isSessionKey = key.startsWith("shinobi:watch-session:");
      const hash = isSessionKey ? "" : parts[2];
      const fileIndex = isSessionKey ? "" : parts[3];

      if ((!parsed.sessionKey && (!hash || !fileIndex)) || !parsed.currentTime) continue;

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
        sessionKey: parsed.sessionKey,
      });
    } catch {}
  }

  const nextItems = collected.sort((a, b) => b.currentTime - a.currentTime).slice(0, 10);
  const nextSignature = JSON.stringify(nextItems);

  if (nextSignature === cachedSignature) return cachedItems;

  cachedSignature = nextSignature;
  cachedItems = nextItems;
  return cachedItems;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
  };
}

export function ContinueWatchingRow() {
  const items = useSyncExternalStore(subscribe, readContinueWatchingItems, () => EMPTY_ITEMS);

  if (!items.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-semibold text-white mb-3">Continue Watching</h2>
      <div className="scroll-row">
        {items.map((item) => {
          const pct = item.duration > 0 ? Math.min(100, (item.currentTime / item.duration) * 100) : 0;
          const href = item.sessionKey
            ? `/watch/resume/${encodeURIComponent(item.sessionKey)}`
            : `/watch/${item.hash}?file=${item.fileIndex}`;
          return (
            <Link key={item.key} href={href} className="cw-card block shrink-0" style={{ width: 260, minWidth: 260 }}>
              <div className="relative rounded-[10px] overflow-hidden bg-[#1e1e1e]" style={{ width: 260, height: 146 }}>
                {item.posterUrl && (
                  <img src={item.posterUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                {item.episodeNumber != null && (
                  <div className="absolute top-2 right-2 z-[2] bg-black/65 rounded px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {item.episodeTotal != null ? `${item.episodeNumber}/${item.episodeTotal}` : `Ep ${item.episodeNumber}`}
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
