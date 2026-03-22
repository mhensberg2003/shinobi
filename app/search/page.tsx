import { MediaCard } from "@/components/media/media-card";
import { searchCatalog } from "@/lib/media/catalog";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchCatalog(query) : [];

  return (
    <main className="mx-auto max-w-[1800px] px-4 pb-16 pt-6 sm:px-8">
      <form action="/search" className="mb-8">
        <div className="flex max-w-xl items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[var(--muted)]">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search anime, shows, movies…"
            autoFocus
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--muted)]"
          />
          {query && (
            <span className="shrink-0 text-xs text-[var(--muted)]">{results.length} results</span>
          )}
        </div>
      </form>

      {results.length > 0 && (
        <>
          {results.filter((i) => i.posterIsLogo).map((item) => (
            <MediaCard key={`${item.provider}-${item.id}`} item={item} />
          ))}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
            {results.filter((i) => !i.posterIsLogo).map((item) => (
              <MediaCard key={`${item.provider}-${item.id}`} item={item} />
            ))}
          </div>
        </>
      )}

      {query && results.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No results for &ldquo;{query}&rdquo;</p>
      )}
    </main>
  );
}
