import { MediaCard } from "./media-card";
import type { MediaSearchItem } from "@/lib/media/types";

export function MediaRow({ title, items }: { title: string; items: MediaSearchItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mb-11">
      <h2 className="text-base font-semibold text-white mb-3.5">{title}</h2>
      <div className="scroll-row">
        {items.map((item) => (
          <MediaCard key={`${item.provider}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}
