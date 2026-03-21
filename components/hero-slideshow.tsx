"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { MediaSearchItem } from "@/lib/media/types";

export function HeroSlideshow({ items }: { items: MediaSearchItem[] }) {
  const slides = items.filter((i) => i.backdropUrl).slice(0, 6);
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      setActive(idx);
      setFading(false);
    }, 300);
  }, [fading]);

  const advance = useCallback((dir: 1 | -1) => {
    setActive((p) => {
      const next = (p + dir + slides.length) % slides.length;
      setFading(true);
      setTimeout(() => setFading(false), 300);
      return next;
    });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => advance(1), 7000);
    return () => clearInterval(t);
  }, [slides.length, advance]);

  if (!slides.length) return null;

  const item = slides[active];
  const href = `/title/${item.provider}/${item.id}${item.provider === "tmdb" ? `?kind=${item.kind}` : ""}`;

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "clamp(500px, 75vh, 850px)" }}>
      {/* backdrop image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[400ms] ease-out"
        style={{
          backgroundImage: `url(${item.backdropUrl})`,
          opacity: fading ? 0 : 1,
        }}
      />

      {/* gradients */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg) 0%, rgba(20,20,20,0.4) 50%, rgba(20,20,20,0.1) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />

      {/* content */}
      <div
        className="absolute bottom-24 left-0 right-0 px-12 md:px-16 lg:px-20 transition-opacity duration-[350ms] ease-out"
        style={{ opacity: fading ? 0 : 1, maxWidth: 700 }}
      >
        {/* title */}
        <h1
          className="font-display font-bold text-white leading-[1.05] mb-4"
          style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
        >
          {item.title}
        </h1>

        {/* meta pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {item.score != null && item.score > 0 && (
            <span className="hero-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5c518"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              {(item.score / 10).toFixed(1)}/10
            </span>
          )}
          {item.year && (
            <span className="hero-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              {item.year}
            </span>
          )}
          {item.subtitle && (
            <span className="hero-pill">{item.subtitle}</span>
          )}
        </div>

        {/* description */}
        {item.description && (
          <p className="text-sm text-white/60 leading-relaxed mb-6 line-clamp-3 max-w-lg">
            {item.description}
          </p>
        )}

        {/* buttons */}
        <div className="flex gap-3">
          <Link href={href} className="hero-btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            Play
          </Link>
          <Link href={href} className="hero-btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            More Info
          </Link>
        </div>
      </div>

      {/* dot navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className="hero-dot"
              style={{
                width: i === active ? 22 : 7,
                background: i === active ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      )}

      {/* side arrows */}
      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => advance(-1)} className="hero-arrow left-5" aria-label="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <button type="button" onClick={() => advance(1)} className="hero-arrow right-5" aria-label="Next">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6" /></svg>
          </button>
        </>
      )}
    </section>
  );
}
