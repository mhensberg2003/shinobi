"use client";

import { useEffect, useRef, useState } from "react";

type PlayerProbeProps = {
  src: string;
};

type ProbeEvent = {
  label: string;
  detail?: string;
  at: string;
};

const WATCHED_EVENTS = [
  "loadstart",
  "loadedmetadata",
  "loadeddata",
  "canplay",
  "canplaythrough",
  "playing",
  "waiting",
  "stalled",
  "suspend",
  "seeking",
  "seeked",
  "progress",
  "error",
] as const;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function PlayerProbe({ src }: PlayerProbeProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [events, setEvents] = useState<ProbeEvent[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const append = (label: string, detail?: string) => {
      setEvents((current) => [
        {
          label,
          detail,
          at: formatTime(new Date()),
        },
        ...current,
      ].slice(0, 24));
    };

    const handlers = WATCHED_EVENTS.map((eventName) => {
      const handler = () => {
        if (eventName === "error") {
          const mediaError = video.error;
          append(
            eventName,
            mediaError
              ? `code=${mediaError.code}${mediaError.message ? ` message=${mediaError.message}` : ""}`
              : "unknown",
          );
          return;
        }

        append(
          eventName,
          `readyState=${video.readyState} networkState=${video.networkState} currentTime=${video.currentTime.toFixed(2)}`,
        );
      };

      video.addEventListener(eventName, handler);
      return { eventName, handler };
    });

    video.load();

    return () => {
      for (const { eventName, handler } of handlers) {
        video.removeEventListener(eventName, handler);
      }
    };
  }, [src]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="glass-panel rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Native Video Test</p>
        <h2 className="mt-2 font-display text-2xl text-white">Browser decode probe</h2>
        <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-black">
          <video
            ref={videoRef}
            src={src}
            controls
            playsInline
            preload="metadata"
            className="aspect-video h-auto w-full bg-black"
          />
        </div>
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Event Log</p>
        <h2 className="mt-2 font-display text-2xl text-white">What the browser does</h2>
        <div className="mt-5 space-y-3">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[var(--muted)]">
              Waiting for media events...
            </div>
          ) : null}
          {events.map((entry, index) => (
            <article
              key={`${entry.at}-${entry.label}-${index}`}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-white">{entry.label}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{entry.at}</p>
              </div>
              {entry.detail ? (
                <p className="mt-2 break-all font-mono text-xs text-[var(--muted)]">{entry.detail}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
