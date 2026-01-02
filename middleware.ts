import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getBusinessSession, createBusinessSession } from "@/lib/business-session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ==========================================================================
  // Security Headers
  // ==========================================================================
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (production only)
  if (process.env.NODE_ENV === 'production') {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://js.stripe.com https://static.cloudflareinsights.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://maps.googleapis.com https://maps.gstatic.com https://q.stripe.com;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https://maps.googleapis.com https://api.stripe.com https://cloudflareinsights.com;
      frame-src 'self' https://www.google.com https://js.stripe.com https://hooks.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set("Content-Security-Policy", cspHeader);
  }

  // ==========================================================================
  // Route Protection (Session-based)
  // ==========================================================================
  const pathname = request.nextUrl.pathname;

  // Get session for protected routes
  const session = await getSession();

  // Protected Business Routes (require BOTH regular session AND business session)
  if (pathname.startsWith('/business/dashboard') ||
    pathname.startsWith('/business/services') ||
    pathname.startsWith('/business/staff') ||
    pathname.startsWith('/business/profile')) {

    // First check regular session
    if (!session) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }

    // Now check business session (re-authentication required)
    const businessSession = await getBusinessSession();
    if (!businessSession) {
      // Redirect to /business which will show re-auth modal
      return NextResponse.redirect(new URL('/business', request.url));
    }

    // SLIDING WINDOW: Refresh business session on every activity
    // This resets the 15-minute timer
    try {
      const newBusinessToken = await createBusinessSession({
        userId: businessSession.userId,
        email: businessSession.email,
        businessId: businessSession.businessId,
      });

      response.cookies.set('business-session', newBusinessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      });
    } catch (error) {
      console.error("Failed to refresh business session:", error);
      // Continue without refreshing if it fails, or redirect?
      // Safer to continue, user will just expire sooner.
    }
  }

  // Protected Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }

    // Check admin role
    if (session.role !== 'admin') {
      // Redirect non-admins to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protected User Routes
  if (pathname.startsWith('/profile') ||
    pathname.startsWith('/bookings')) {

    if (!session) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  /* 
   * Removing aggressive redirect to home for authenticated users on auth pages.
   * This prevents race conditions where the client thinks its unauthenticated
   * and redirects to signin, but middleware thinks its authenticated and
   * redirects to home, causing the user to land on the home page unexpectedly.
   * The SigninPage component now handles this redirection logic itself.
   */
  // if (session && (pathname === '/signin' || pathname === '/signup')) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
