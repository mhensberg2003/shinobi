"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MediaSearchItem } from "@/lib/media/types";

export function HeroSlideshow({ items }: { items: MediaSearchItem[] }) {
  const slides = items.filter((i) => i.backdropUrl).slice(0, 6);
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  function advance(dir: 1 | -1) {
    setFading(true);
    setTimeout(() => {
      setActive((p) => (p + dir + slides.length) % slides.length);
      setFading(false);
    }, 300);
  }

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => advance(1), 7000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;

  const item = slides[active];
  const href = `/title/${item.provider}/${item.id}${item.provider === "tmdb" ? `?kind=${item.kind}` : ""}`;
  const bg = item.backdropUrl!;

  return (
    <section style={{ position: "relative", height: "clamp(320px, 28vw, 500px)", overflow: "hidden" }}>
      {/* backdrop */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
      />

      {/* gradients */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #141414 0%, rgba(20,20,20,0.55) 45%, rgba(20,20,20,0.15) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, transparent 65%)" }} />

      {/* content */}
      <div
        style={{
          position: "absolute", bottom: 72, left: 0, right: 0,
          padding: "0 48px",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
      >
        {/* genres */}
        {item.genres && item.genres.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {item.genres.slice(0, 3).map((g) => (
              <span key={g} style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 8px" }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* title */}
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 12, maxWidth: 600 }}>
          {item.title}
        </h1>

        {/* meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          {item.score && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#f5c518"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {(item.score / 10).toFixed(1)}
            </span>
          )}
          {item.year && <span>{item.year}</span>}
          {item.subtitle && <span>{item.subtitle}</span>}
        </div>

        {/* description */}
        {item.description && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 480, marginBottom: 24,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
            {item.description}
          </p>
        )}

        {/* buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={href} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", color: "#000",
            borderRadius: 6, padding: "10px 22px",
            fontSize: 14, fontWeight: 600,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Play
          </Link>
          <Link href={href} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)", color: "#fff",
            borderRadius: 6, padding: "10px 22px",
            fontSize: 14, fontWeight: 600,
            backdropFilter: "blur(8px)",
          }}>
            More Info
          </Link>
        </div>
      </div>

      {/* nav dots */}
      <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setFading(true); setTimeout(() => { setActive(i); setFading(false); }, 300); }}
            style={{
              width: i === active ? 20 : 6, height: 6, borderRadius: 3,
              background: i === active ? "#fff" : "rgba(255,255,255,0.35)",
              border: "none", cursor: "pointer", padding: 0,
              transition: "width 0.3s, background 0.3s",
            }}
          />
        ))}
      </div>

      {/* side arrows */}
      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => advance(-1)} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <button type="button" onClick={() => advance(1)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </>
      )}
    </section>
  );
}
