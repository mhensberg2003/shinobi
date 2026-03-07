import { type NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/media/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);
  const results = await searchCatalog(q);
  return NextResponse.json(results.slice(0, 12));
}
