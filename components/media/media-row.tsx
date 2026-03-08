import { MediaCard } from "./media-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MediaSearchItem } from "@/lib/media/types";

export function MediaRow({ title, items }: { title: string; items: MediaSearchItem[] }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: 44 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 14 }}>{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div style={{ display: "flex", gap: 10, width: "max-content", paddingBottom: 6 }}>
          {items.map((item) => (
            <MediaCard key={`${item.provider}-${item.id}`} item={item} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
