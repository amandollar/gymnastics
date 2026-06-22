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
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/admin")) {
      const cleanPath = pathname.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(new URL(cleanPath, req.url));
    }

    if (pathname.startsWith("/portal")) {
      const cleanPath = pathname.replace(/^\/portal/, "") || "/";
      return NextResponse.redirect(buildAppUrl(url, hostname, "portal", cleanPath));
    }

    if (!pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-subdomain-rewritten", "true");
      return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url), {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  if (currentHost === "portal") {
    if (pathname.startsWith("/portal")) {
      const cleanPath = pathname.replace(/^\/portal/, "") || "/";
      return NextResponse.redirect(new URL(cleanPath, req.url));
    }

    if (pathname.startsWith("/admin")) {
      const cleanPath = pathname.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(buildAppUrl(url, hostname, "admin", cleanPath));
    }

    if (!pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-subdomain-rewritten", "true");
      return NextResponse.rewrite(new URL(`/portal${pathname}`, req.url), {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  if (currentHost === "main") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
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
