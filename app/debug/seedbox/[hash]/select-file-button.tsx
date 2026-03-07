"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function SelectFileButton({
  hash,
  fileIndex,
  isSelected,
}: {
  hash: string;
  fileIndex: number;
  isSelected: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/seedbox/select-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash,
          fileIndex,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to select torrent file.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (selectionError) {
      setError(
        selectionError instanceof Error ? selectionError.message : "Failed to select torrent file.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || isSelected}
        className="rounded-full border border-sky-200/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSelected ? "Selected for download" : pending ? "Selecting..." : "Stream this file only"}
      </button>
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}
