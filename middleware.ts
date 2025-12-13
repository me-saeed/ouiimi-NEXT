import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://maps.googleapis.com https://maps.gstatic.com https://q.stripe.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://maps.googleapis.com https://api.stripe.com;
    frame-src 'self' https://www.google.com https://js.stripe.com https://hooks.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
  response.headers.set("Content-Security-Policy", cspHeader);

  // HTTPS enforcement - DISABLED when behind proxy (Cloudflare/Nginx)
  // Cloudflare and Nginx handle HTTPS redirects, so we don't need to do it here
  // Only redirect if directly accessed (no proxy headers)
  // Auth Protection for Business Routes
  // Check if accessing a protected business route
  if (request.nextUrl.pathname.startsWith("/business/register") || request.nextUrl.pathname.startsWith("/business/dashboard")) {
    const token = request.cookies.get("token")?.value;

    // If no token, redirect to signin
    /*
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      // Optional: Add return URL
      url.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    */
    if (!token) {
      console.log("Middleware: No token found for protected route:", request.nextUrl.pathname);
      // Allowing through temporarily for debugging
    }
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

