import Link from "next/link";
import { getMediaHref } from "@/lib/media/catalog";
import type { MediaSearchItem } from "@/lib/media/types";

export function MediaCard({ item }: { item: MediaSearchItem }) {
  if (item.posterIsLogo) {
    return (
      <Link href={getMediaHref(item)} className="media-card mb-4 block">
        <div className="relative flex h-[160px] max-w-[600px] items-center rounded-[10px] bg-[#1e1e1e] px-10">
          {item.posterUrl && (
            <img src={item.posterUrl} alt={item.title} className="h-[60%] w-auto object-contain" loading="lazy" />
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={getMediaHref(item)} className="media-card block shrink-0" style={{ width: 175, minWidth: 175 }}>
      <div className="relative rounded-[10px] overflow-hidden bg-[#1e1e1e]" style={{ width: 175, height: 263 }}>
        {item.posterUrl && (
          <img src={item.posterUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)" }} />
        <p className="absolute bottom-2.5 left-2.5 right-2.5 text-xs font-semibold text-white leading-tight line-clamp-2">
          {item.title}
        </p>
      </div>
    </Link>
  );
}
