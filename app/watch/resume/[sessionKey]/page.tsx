import { notFound } from "next/navigation";

import { ResumeWatchProgress } from "@/components/player/resume-watch-progress";
import { getWatchSession } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";

type PageProps = {
  params: Promise<{ sessionKey: string }>;
};

export const dynamic = "force-dynamic";

export default async function ResumeWatchPage({ params }: PageProps) {
  const { sessionKey } = await params;

  if (!getMediaBackendConfig()) {
    notFound();
  }

  const session = await getWatchSession(sessionKey).catch(() => null);
  if (!session) {
    notFound();
  }

  return <ResumeWatchProgress session={session} />;
}
