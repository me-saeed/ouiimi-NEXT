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

  // HTTPS enforcement - DISABLED when behind proxy (Cloudflare/Nginx)
  // Cloudflare and Nginx handle HTTPS redirects, so we don't need to do it here
  // Only redirect if directly accessed (no proxy headers)
  const hasProxyHeaders = 
    request.headers.get("x-forwarded-proto") || 
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip");
  
  // Skip HTTPS redirect if behind a proxy (Cloudflare/Nginx)
  if (!hasProxyHeaders && process.env.NODE_ENV === "production") {
    // Only redirect direct HTTP access (not through proxy)
    // This should rarely happen in production
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

