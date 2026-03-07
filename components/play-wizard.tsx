"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type TorrentFile = {
  index: number;
  path: string;
  sizeBytes: number;
  progress: number;
  isPlayableVideo: boolean;
};

type Step = "magnet" | "loading" | "files";

async function fetchFilesWithRetry(
  hash: string,
  onAttempt: (n: number) => void,
  maxAttempts = 20,
  delayMs = 1500,
): Promise<TorrentFile[]> {
  for (let i = 0; i < maxAttempts; i++) {
    onAttempt(i + 1);
    const res = await fetch(`/api/seedbox/torrent?hash=${hash}`);
    const data = await res.json() as { ok: boolean; details?: { files: TorrentFile[] }; error?: string };
    if (data.ok && data.details) {
      const playable = data.details.files.filter((f) => f.isPlayableVideo);
      if (playable.length > 0) return playable;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return [];
}

function Spinner() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" style={{ animation: "wiz-spin 0.75s linear infinite", flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

export function PlayWizard({ episodeHint, posterUrl, episodeNumber, episodeTotal, onClose }: { episodeHint?: string; posterUrl?: string; episodeNumber?: number; episodeTotal?: number; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("magnet");
  const [magnet, setMagnet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [files, setFiles] = useState<TorrentFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Adding to seedbox…");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submitMagnet() {
    const trimmed = magnet.trim();
    if (!trimmed.startsWith("magnet:?")) { setError("Paste a valid magnet link."); return; }
    setError(null);
    setStep("loading");

    try {
      const res = await fetch("/api/seedbox/magnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnetLink: trimmed }),
      });
      const data = await res.json() as { ok: boolean; addedHash?: string | null; error?: string };
      if (!data.ok || !data.addedHash) throw new Error(data.error ?? "Could not detect new torrent.");

      setHash(data.addedHash);
      setLoadingMsg("Waiting for torrent metadata…");

      const playable = await fetchFilesWithRetry(
        data.addedHash,
        (n) => setLoadingMsg(`Fetching file list${n > 1 ? ` (attempt ${n})` : ""}…`),
      );

      setFiles(playable);
      setStep("files");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("magnet");
    }
  }

  async function pickFile(fileIndex: number) {
    if (!hash || busy) return;
    setBusy(true);
    try {
      await fetch("/api/seedbox/select-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, fileIndex }),
      });
      const url = `/watch/${hash}?file=${fileIndex}${posterUrl ? `&poster=${encodeURIComponent(posterUrl)}` : ""}${episodeHint ? `&title=${encodeURIComponent(episodeHint)}` : ""}${episodeNumber != null ? `&ep=${episodeNumber}` : ""}${episodeTotal != null ? `&eps=${episodeTotal}` : ""}`;
      router.push(url);
    } catch {
      setBusy(false);
    }
  }

  const stepLabel = step === "magnet" ? "Step 1 of 2 — Magnet link" : step === "loading" ? "Adding to seedbox…" : "Step 2 of 2 — Pick a file";

  return (
    <>
      <style>{`@keyframes wiz-spin { to { transform: rotate(360deg); } }`}</style>

      {/* backdrop */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      >
        {/* panel */}
        <div style={{ width: "100%", maxWidth: 500, background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>

          {/* header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <p style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.12em" }}>{stepLabel}</p>
              {episodeHint && <p style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{episodeHint}</p>}
            </div>
            <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#888", flexShrink: 0, marginLeft: 12 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* body */}
          <div style={{ padding: "20px" }}>

            {/* STEP: magnet */}
            {step === "magnet" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <textarea
                  ref={inputRef}
                  value={magnet}
                  onChange={(e) => setMagnet(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitMagnet(); }}
                  placeholder="magnet:?xt=urn:btih:…"
                  rows={4}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#fff", resize: "none", outline: "none", fontFamily: "monospace", lineHeight: 1.5 }}
                />
                {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
                <button
                  type="button"
                  onClick={submitMagnet}
                  style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Add &amp; pick file →
                </button>
              </div>
            )}

            {/* STEP: loading */}
            {step === "loading" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "36px 0" }}>
                <Spinner />
                <p style={{ fontSize: 13, color: "#666" }}>{loadingMsg}</p>
              </div>
            )}

            {/* STEP: file picker */}
            {step === "files" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
                {files.length === 0 && (
                  <p style={{ fontSize: 13, color: "#666", textAlign: "center", padding: "28px 0" }}>
                    No playable files found after waiting. The torrent may still be resolving — close and try again in a moment.
                  </p>
                )}
                {files.map((file) => {
                  const name = file.path.split("/").at(-1) ?? file.path;
                  const mb = Math.round(file.sizeBytes / 1024 / 1024);
                  return (
                    <button
                      key={file.index}
                      type="button"
                      onClick={() => pickFile(file.index)}
                      disabled={busy}
                      style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", cursor: busy ? "not-allowed" : "pointer", textAlign: "left", opacity: busy ? 0.5 : 1 }}
                      onMouseEnter={(e) => { if (!busy) (e.currentTarget).style.background = "rgba(255,255,255,0.09)"; }}
                      onMouseLeave={(e) => { (e.currentTarget).style.background = "rgba(255,255,255,0.04)"; }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {busy ? <Spinner /> : <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{name}</p>
                        <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{mb > 0 ? `${mb} MB` : "unknown size"} · {file.progress}% downloaded</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
