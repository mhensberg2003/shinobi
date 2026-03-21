"use client";

import nextDynamic from "next/dynamic";

export const WatchPageShell = nextDynamic(
  () => import("./watch-ready-shell").then((mod) => mod.WatchReadyShell),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
        <div className="h-5 w-5 animate-spin rounded-full border-[2px] border-white/10 border-t-white/50" />
      </div>
    ),
  },
);
