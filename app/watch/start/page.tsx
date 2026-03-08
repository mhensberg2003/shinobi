import { AutoResolveProgress } from "@/components/player/auto-resolve-progress";

type PageProps = {
  searchParams: Promise<{
    requestKey?: string;
    title?: string;
    alt?: string | string[];
    provider?: "anilist" | "tmdb";
    mediaId?: string;
    kind?: "anime" | "movie" | "show";
    poster?: string;
    hint?: string;
    year?: string;
    ep?: string;
    eps?: string;
  }>;
};

function toArray(input?: string | string[]): string[] {
  if (!input) {
    return [];
  }

  return Array.isArray(input) ? input : [input];
}

export const dynamic = "force-dynamic";

export default async function WatchStartPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <AutoResolveProgress
      requestKey={params.requestKey ?? "missing-request-key"}
      title={params.title ?? "Untitled"}
      alternateTitles={toArray(params.alt)}
      provider={params.provider}
      mediaId={params.mediaId}
      kind={params.kind}
      posterUrl={params.poster}
      year={params.year ? Number(params.year) : undefined}
      episodeHint={params.hint}
      episodeNumber={params.ep ? Number(params.ep) : undefined}
      episodeTotal={params.eps ? Number(params.eps) : undefined}
    />
  );
}
