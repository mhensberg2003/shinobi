"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function PlayButton({ label = "Play", title, alternateTitles, provider, mediaId, kind, posterUrl, year, episodeHint, episodeNumber, episodeTotal, className, style }: {
  label?: string;
  title: string;
  alternateTitles?: string[];
  provider?: "anilist" | "tmdb";
  mediaId?: string;
  kind?: "anime" | "movie" | "show";
  episodeHint?: string;
  posterUrl?: string;
  year?: number;
  episodeNumber?: number;
  episodeTotal?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const requestKeyRef = useRef<string | null>(null);

  function handleClick() {
    if (pending) {
      return;
    }

    setPending(true);
    requestKeyRef.current ??= crypto.randomUUID();

    const params = new URLSearchParams({
      requestKey: requestKeyRef.current,
      title,
    });

    for (const alt of alternateTitles ?? []) {
      params.append("alt", alt);
    }

    if (provider) {
      params.set("provider", provider);
    }
    if (mediaId) {
      params.set("mediaId", mediaId);
    }
    if (kind) {
      params.set("kind", kind);
    }
    if (posterUrl) {
      params.set("poster", posterUrl);
    }
    if (year != null) {
      params.set("year", String(year));
    }
    if (episodeHint) {
      params.set("hint", episodeHint);
    }
    if (episodeNumber != null) {
      params.set("ep", String(episodeNumber));
    }
    if (episodeTotal != null) {
      params.set("eps", String(episodeTotal));
    }

    router.push(`/watch/start?${params.toString()}`);
  }

  return (
    <button type="button" onClick={handleClick} className={className} style={style}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><polygon points="5,3 19,12 5,21"/></svg>
        {label}
    </button>
  );
}
