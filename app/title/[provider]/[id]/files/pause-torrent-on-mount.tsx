"use client";

import { useEffect } from "react";

export function PauseTorrentOnMount({ hash }: { hash: string }) {
  useEffect(() => {
    void fetch("/api/seedbox/pause-torrent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash }),
    }).catch(() => {});
  }, [hash]);

  return null;
}
