import { NextResponse } from "next/server";

import { getDemuxJob } from "@/lib/media-backend/client";
import { getMediaBackendConfig } from "@/lib/media-backend/config";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  if (!getMediaBackendConfig()) {
    return NextResponse.json(
      { ok: false, error: "Media backend is not configured." },
      { status: 503 },
    );
  }

  try {
    const { jobId } = await context.params;
    const job = await getDemuxJob(jobId);

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        output: job.output
          ? {
              ...job.output,
              subtitles: job.output.subtitles.map((url) => {
                const token = Buffer.from(url).toString("base64url");
                return `/api/media-backend/artifact?url=${encodeURIComponent(token)}`;
              }),
              audio: job.output.audio.map((url) => {
                const token = Buffer.from(url).toString("base64url");
                return `/api/media-backend/artifact?url=${encodeURIComponent(token)}`;
              }),
            }
          : undefined,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load media backend job.",
      },
      { status: 500 },
    );
  }
}
