import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // HTTPS enforcement in production
  // Only redirect if we're directly accessed (not behind a proxy)
  // Cloudflare and Nginx handle HTTPS, so we trust X-Forwarded-Proto
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isBehindProxy = request.headers.get("x-forwarded-for") || forwardedProto;
  
  // Only enforce HTTPS if not behind a proxy (direct access)
  if (
    process.env.NODE_ENV === "production" &&
    !isBehindProxy &&
    request.nextUrl.protocol !== "https:"
  ) {
    const host = request.headers.get("host") || request.nextUrl.host;
    return NextResponse.redirect(
      `https://${host}${request.nextUrl.pathname}`,
      301
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

