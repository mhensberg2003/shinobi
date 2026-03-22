"use client";

import { useParams } from "next/navigation";

import { ResumeWatchProgress } from "@/components/player/resume-watch-progress";

export const dynamic = "force-dynamic";

export default function ResumeWatchPage() {
  const { sessionKey } = useParams<{ sessionKey: string }>();

  return <ResumeWatchProgress sessionKey={sessionKey} />;
}
