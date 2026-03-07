"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MediaSearchItem } from "@/lib/media/types";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // debounced live search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(await res.json());
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  // close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function close() { setOpen(false); setQuery(""); setResults([]); }

  return (
    <div
      ref={wrapRef}
      style={{ position: "fixed", top: 12, left: 0, right: 0, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}
    >
      {/* pill nav */}
      <nav style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 2, height: 42, padding: "0 6px", borderRadius: 999, background: "rgba(28,28,28,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
        <Link href="/" onClick={close} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "transparent", color: "#fff", marginRight: 4, overflow: "hidden" }}>
          <Image src="/logo.png" alt="Shinobi" width={24} height={24} style={{ width: 24, height: 24, objectFit: "contain" }} />
        </Link>
        <Link href="/" onClick={close} style={{ padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", height: 42, display: "flex", alignItems: "center" }}>Home</Link>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Search"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", background: open ? "rgba(255,255,255,0.12)" : "transparent", border: "none", cursor: "pointer", color: open ? "#fff" : "rgba(255,255,255,0.55)", transition: "background 0.15s, color 0.15s" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </nav>

      {/* slide-down search panel */}
      <div style={{
        pointerEvents: open ? "auto" : "none",
        marginTop: 8,
        width: "min(540px, calc(100vw - 32px))",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(-10px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}>
        {/* input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,22,22,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: results.length ? "12px 12px 0 0" : 12, padding: "10px 16px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, shows, movies…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#fff" }}
          />
          {loading && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" style={{ flexShrink: 0, animation: "spin 0.8s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          )}
        </div>

        {/* results */}
        {results.length > 0 && (
          <div style={{ background: "rgba(18,18,18,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)", borderTop: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 12px 12px", overflow: "hidden", maxHeight: 420, overflowY: "auto" }}>
            {results.map((item) => {
              const href = `/title/${item.provider}/${item.id}${item.provider === "tmdb" ? `?kind=${item.kind}` : ""}`;
              return (
                <Link
                  key={`${item.provider}-${item.id}`}
                  href={href}
                  onClick={close}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* tiny poster */}
                  <div style={{ width: 36, height: 54, borderRadius: 5, overflow: "hidden", background: "#2a2a2a", flexShrink: 0 }}>
                    {item.posterUrl && <img src={item.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      {[item.kind, item.year, item.subtitle].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                </Link>
              );
            })}
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div style={{ background: "rgba(18,18,18,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderTop: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 12px 12px", padding: "16px 14px", fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
            No results for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
