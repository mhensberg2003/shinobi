import { ContinueWatchingRow } from "@/components/media/continue-watching-row";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { MediaRow } from "@/components/media/media-row";
import { getHomeCatalog } from "@/lib/media/catalog";

export default async function Home() {
  const catalog = await getHomeCatalog();

  return (
    <>
      <HeroSlideshow items={catalog.anime} />
      <main style={{ paddingTop: 40, paddingBottom: 64, paddingLeft: 32, paddingRight: 32 }}>
        <ContinueWatchingRow />
        <MediaRow title="Trending Anime" items={catalog.anime} />
        <MediaRow title="TV Shows" items={catalog.shows} />
        <MediaRow title="Movies" items={catalog.movies} />
      </main>
    </>
  );
}
