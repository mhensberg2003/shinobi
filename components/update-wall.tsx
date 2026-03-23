"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "available" | "downloading" | "ready" | "error";
type UpdateMode = "auto" | "manual";

type ElectronUpdateAPI = {
  download(): Promise<{ mode: UpdateMode; opened: boolean }>;
  install(): Promise<{ mode: UpdateMode }>;
  onAvailable(cb: (data: { version: string; currentVersion: string; mode: UpdateMode; releaseUrl?: string }) => void): () => void;
  onDownloadProgress(cb: (data: { percent: number }) => void): () => void;
  onDownloaded(cb: () => void): () => void;
  onError(cb: (data: { message: string }) => void): () => void;
};

function getUpdateAPI(): ElectronUpdateAPI | null {
  const w = globalThis as unknown as { electronAPI?: { update?: ElectronUpdateAPI } };
  return w.electronAPI?.update ?? null;
}

export function UpdateWall() {
  const [status, setStatus] = useState<Status>("idle");
  const [version, setVersion] = useState("");
  const [currentVersion, setCurrentVersion] = useState("");
  const [mode, setMode] = useState<UpdateMode>("auto");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = getUpdateAPI();
    if (!api) return;

    const unsubs = [
      api.onAvailable((data) => {
        setVersion(data.version);
        setCurrentVersion(data.currentVersion);
        setMode(data.mode);
        setError("");
        setProgress(0);
        setDismissed(false);
        setStatus("available");
      }),
      api.onDownloadProgress((data) => {
        setProgress(data.percent);
      }),
      api.onDownloaded(() => {
        setStatus("ready");
      }),
      api.onError((data) => {
        setError(data.message);
        setStatus("error");
      }),
    ];

    return () => unsubs.forEach((fn) => fn());
  }, []);

  if (status === "idle" || dismissed) return null;

  async function handleDownload() {
    const api = getUpdateAPI();
    if (!api) return;
    try {
      if (mode === "manual") {
        await api.download();
        setDismissed(true);
        return;
      }
      setStatus("downloading");
      setProgress(0);
      await api.download();
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }

  async function handleInstall() {
    const api = getUpdateAPI();
    if (!api) return;
    try {
      await api.install();
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }

  function handleRetry() {
    setError("");
    void handleDownload();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.92)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: "#e50914",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e5e5e5", margin: 0 }}>
          {status === "available" && "Update Available"}
          {status === "downloading" && "Downloading..."}
          {status === "ready" && "Ready to Install"}
          {status === "error" && "Update Failed"}
        </h1>

        {/* Version info */}
        {version && (
          <p style={{ color: "#888", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            {status === "ready"
              ? `Version ${version} is ready to install. The app will restart.`
              : mode === "manual"
                ? "A new version of Shinobi is available. macOS updates are installed from the release download."
                : "A new version of Shinobi is available."}
            {status !== "ready" && (
              <>
                <br />
                <span style={{ color: "#666" }}>
                  {currentVersion} → {version}
                </span>
              </>
            )}
          </p>
        )}

        {/* Download progress */}
        {status === "downloading" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                width: "100%",
                height: 4,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "#e50914",
                  borderRadius: 2,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <span style={{ color: "#888", fontSize: 13 }}>{progress}%</span>
          </div>
        )}

        {/* Error message */}
        {status === "error" && (
          <p style={{ color: "#e50914", fontSize: 13, margin: 0, maxWidth: 350, wordBreak: "break-word" }}>
            {error}
          </p>
        )}

        {/* Actions */}
        {status === "available" && mode === "auto" && (
          <button onClick={() => { void handleDownload(); }} style={btnStyle}>
            Install Update
          </button>
        )}

        {status === "available" && mode === "manual" && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { void handleDownload(); }} style={btnStyle}>
              Download Release
            </button>
            <button onClick={() => setDismissed(true)} style={secondaryBtnStyle}>
              Later
            </button>
          </div>
        )}

        {status === "ready" && (
          <button onClick={() => { void handleInstall(); }} style={btnStyle}>
            Restart & Install
          </button>
        )}

        {status === "error" && (
          <button onClick={handleRetry} style={btnStyle}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "12px 32px",
  fontSize: 16,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#e50914",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  ...btnStyle,
  color: "#e5e5e5",
  backgroundColor: "rgba(255,255,255,0.08)",
};
