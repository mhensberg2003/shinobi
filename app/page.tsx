import { ContinueWatchingRow } from "@/components/media/continue-watching-row";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { MediaRow } from "@/components/media/media-row";
import { getHomeCatalog } from "@/lib/media/catalog";

export default async function Home() {
  const catalog = await getHomeCatalog();

  // combine all items for hero, preferring ones with backdrop images
  const heroItems = [...catalog.movies, ...catalog.shows, ...catalog.anime]
    .filter((i) => i.backdropUrl)
    .slice(0, 8);

  return (
    <>
      <HeroSlideshow items={heroItems} />
      <main className="relative z-10 -mt-16 px-8 md:px-12 lg:px-16 pb-16">
        <ContinueWatchingRow />
        <MediaRow title="Trending Anime" items={catalog.anime} />
        <MediaRow title="TV Shows" items={catalog.shows} />
        <MediaRow title="Movies" items={catalog.movies} />
      </main>
    </>
  );
}
