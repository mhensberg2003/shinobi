import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT 1 FROM sessions
        WHERE id = ${sessionId} AND expires_at > NOW()
        LIMIT 1
      `;
      if (rows.length > 0) {
        return NextResponse.next();
      }
    } catch {
      // DB error — fail open or fail closed? For a private app, fail closed.
    }
  }

  // API routes → 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Page routes → redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, public assets
     */
    "/((?!_next/static|_next/image|favicon|logo|public).*)",
  ],
};
