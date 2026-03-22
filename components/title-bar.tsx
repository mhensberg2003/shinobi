"use client";

import { useEffect, useState } from "react";

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const api = (window as any).electronAPI?.window;
    if (!api) return;
    setIsElectron(true);
    api.isMaximized().then(setMaximized);
  }, []);

  if (!isElectron) return null;

  const api = (window as any).electronAPI?.window;

  function minimize() { api?.minimize(); }
  function toggleMaximize() {
    api?.maximize().then(() => api.isMaximized().then(setMaximized));
  }
  function close() { api?.close(); }

  return (
    <div
      className="title-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        zIndex: 9999,
        WebkitAppRegion: "drag",
      } as React.CSSProperties}
    >
      {/* Window controls */}
      <div
        style={{ display: "flex", WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button onClick={minimize} title="Minimize" style={btnStyle}>
          {/* Minimize icon */}
          <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button onClick={toggleMaximize} title={maximized ? "Restore" : "Maximize"} style={btnStyle}>
          {maximized ? (
            /* Restore icon */
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="0" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />
              <rect x="0" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="#141414" />
            </svg>
          ) : (
            /* Maximize icon */
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </button>
        <button
          onClick={close}
          title="Close"
          style={btnStyle}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#e50914")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {/* Close icon */}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 46,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "#888",
  cursor: "pointer",
  transition: "background-color 0.15s, color 0.15s",
};
