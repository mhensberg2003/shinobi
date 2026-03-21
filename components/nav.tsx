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
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // track scroll for nav background
  useEffect(() => {
    const scroller = document.querySelector("[data-scroll-root]");
    if (!scroller) return;
    function onScroll() {
      setScrolled((scroller as HTMLElement).scrollTop > 40);
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

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
    <div ref={wrapRef} className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none pt-3">
      {/* floating pill nav */}
      <nav
        className="pointer-events-auto flex items-center gap-1 h-11 px-1.5 rounded-full transition-all duration-300"
        style={{
          background: scrolled ? "rgba(20,20,20,0.88)" : "rgba(28,28,28,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.5)" : "0 2px 16px rgba(0,0,0,0.3)",
        }}
      >
        <Link href="/" onClick={close} className="flex items-center justify-center w-8 h-8 rounded-full ml-0.5">
          <Image src="/logo.png" alt="Shinobi" width={22} height={22} className="object-contain" />
        </Link>

        <NavLink href="/" onClick={close}>Home</NavLink>
        <NavLink href="/?filter=movies" onClick={close}>Movies</NavLink>
        <NavLink href="/?filter=series" onClick={close}>Series</NavLink>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Search"
          className="flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer transition-colors duration-150 mr-0.5"
          style={{ background: open ? "rgba(255,255,255,0.12)" : "transparent", color: open ? "#fff" : "rgba(255,255,255,0.55)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </nav>

      {/* search panel */}
      <div
        className="mt-2 transition-all duration-200 ease-out"
        style={{
          pointerEvents: open ? "auto" : "none",
          width: "min(540px, calc(100vw - 32px))",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-10px)",
        }}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 border border-white/12"
          style={{
            background: "rgba(22,22,22,0.92)",
            backdropFilter: "blur(24px)",
            borderRadius: results.length ? "12px 12px 0 0" : "12px",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, shows, movies…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white"
          />
          {loading && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" className="shrink-0 animate-spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}
        </div>

        {results.length > 0 && (
          <div className="max-h-[420px] overflow-auto rounded-b-xl border border-white/12 border-t-white/6" style={{ background: "rgba(18,18,18,0.97)", scrollbarWidth: "none" }}>
            {results.map((item) => {
              const href = `/title/${item.provider}/${item.id}${item.provider === "tmdb" ? `?kind=${item.kind}` : ""}`;
              return (
                <Link
                  key={`${item.provider}-${item.id}`}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/5 hover:bg-white/6 transition-colors duration-100"
                >
                  <div className="w-9 h-[54px] rounded-[5px] overflow-hidden bg-[#2a2a2a] shrink-0">
                    {item.posterUrl && <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {[item.kind, item.year, item.subtitle].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>
                </Link>
              );
            })}
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="rounded-b-xl border border-white/12 border-t-white/6 px-3.5 py-4 text-[13px] text-white/35 text-center" style={{ background: "rgba(18,18,18,0.97)" }}>
            No results for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

function NavLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="px-3 text-[13px] font-normal text-white/70 hover:text-white h-8 flex items-center rounded-full hover:bg-white/8 transition-all duration-150">
      {children}
    </Link>
  );
}
