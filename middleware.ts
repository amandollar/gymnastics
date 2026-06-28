import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAppHost } from "@/lib/utils/host";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const currentHost = getAppHost(hostname);
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Handle admin subdomain
  if (currentHost === "admin") {
    // If accessing admin subdomain, rewrite to /admin/... path
    if (!pathname.startsWith("/admin")) {
      const newPathname = pathname === "/" ? "/admin/dashboard" : `/admin${pathname}`;
      url.pathname = newPathname;
      return NextResponse.rewrite(url);
    }
  }

  // Handle portal subdomain
  if (currentHost === "portal") {
    // If accessing portal subdomain, rewrite to /portal/... path
    if (!pathname.startsWith("/portal")) {
      const newPathname = pathname === "/" ? "/portal" : `/portal${pathname}`;
      url.pathname = newPathname;
      return NextResponse.rewrite(url);
    }
  }

  // Handle main domain - ensure it doesn't get admin/portal paths
  if (currentHost === "main") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
      // Redirect to main landing page if trying to access admin/portal on main domain
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
