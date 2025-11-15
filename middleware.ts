import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

const publicPaths = ["/", "/login", "/signup"];
const authPaths = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check session for protected routes
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Redirect to login if no session and trying to access protected route
  if (!session && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if logged in and trying to access auth pages
  if (session && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
