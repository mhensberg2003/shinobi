import Link from "next/link";
import { getMediaHref } from "@/lib/media/catalog";
import type { MediaSearchItem } from "@/lib/media/types";

export function MediaCard({ item }: { item: MediaSearchItem }) {
  const isLogo = item.posterIsLogo;
  const w = isLogo ? 220 : 175;
  const h = isLogo ? 263 : 263;

  return (
    <Link href={getMediaHref(item)} className="media-card block shrink-0" style={{ width: w, minWidth: w }}>
      <div className="relative rounded-[10px] overflow-hidden bg-[#1e1e1e]" style={{ width: w, height: h }}>
        {item.posterUrl && (
          isLogo ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <img src={item.posterUrl} alt={item.title} className="max-w-full max-h-full object-contain" loading="lazy" />
            </div>
          ) : (
            <img src={item.posterUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          )
        )}
        {!isLogo && (
          <>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)" }} />
            <p className="absolute bottom-2.5 left-2.5 right-2.5 text-xs font-semibold text-white leading-tight line-clamp-2">
              {item.title}
            </p>
          </>
        )}
      </div>
    </Link>
  );
}
