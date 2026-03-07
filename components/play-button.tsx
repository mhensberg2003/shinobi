"use client";

import { useState } from "react";
import { PlayWizard } from "./play-wizard";

export function PlayButton({ label = "Play", episodeHint, posterUrl, episodeNumber, episodeTotal, className, style }: {
  label?: string;
  episodeHint?: string;
  posterUrl?: string;
  episodeNumber?: number;
  episodeTotal?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={style}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><polygon points="5,3 19,12 5,21"/></svg>
        {label}
      </button>
      {open && <PlayWizard episodeHint={episodeHint} posterUrl={posterUrl} episodeNumber={episodeNumber} episodeTotal={episodeTotal} onClose={() => setOpen(false)} />}
    </>
  );
}
