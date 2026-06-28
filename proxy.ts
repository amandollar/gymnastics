import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { buildAppUrl, getAppHost } from "@/lib/utils/host";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  if (req.headers.get("x-subdomain-rewritten") === "true") {
    return NextResponse.next();
  }

  const currentHost = getAppHost(hostname);
  const { pathname } = url;

  if (currentHost === "admin") {
    if (pathname === "/") {
      const rewriteUrl = new URL("/admin/dashboard", req.url);
      rewriteUrl.search = url.search;
      return NextResponse.rewrite(rewriteUrl);
    }

    if (pathname.startsWith("/admin")) {
      // Already on admin path, let it through
      return NextResponse.next();
    }

    if (pathname.startsWith("/portal")) {
      // Redirect portal requests to portal subdomain
      const cleanPath = pathname.replace(/^\/portal/, "") || "/";
      return NextResponse.redirect(buildAppUrl(url, hostname, "portal", cleanPath));
    }

    if (!pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      // Rewrite all other paths to /admin/...
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-subdomain-rewritten", "true");
      const rewriteUrl = new URL(`/admin${pathname}`, req.url);
      rewriteUrl.search = url.search;
      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  if (currentHost === "portal") {
    if (pathname.startsWith("/portal")) {
      // Already on portal path, let it through
      return NextResponse.next();
    }

    if (pathname.startsWith("/admin")) {
      // Redirect admin requests to admin subdomain
      const cleanPath = pathname.replace(/^\/admin/, "") || "/dashboard";
      return NextResponse.redirect(buildAppUrl(url, hostname, "admin", cleanPath));
    }

    if (!pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      // Rewrite all other paths to /portal/...
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-subdomain-rewritten", "true");
      const rewriteUrl = new URL(`/portal${pathname}`, req.url);
      rewriteUrl.search = url.search;
      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  if (currentHost === "main") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
      // Redirect admin/portal paths on main domain to home
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
