import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Prevent middleware loops from internal rewrites
  if (req.headers.get("x-subdomain-rewritten") === "true") {
    return NextResponse.next();
  }

  // 1. Determine the subdomain
  let currentHost = hostname;
  if (currentHost.includes("localhost")) {
    currentHost = currentHost.replace(".localhost:3000", "").replace("localhost:3000", "main");
  } else {
    const parts = currentHost.split(".");
    if (parts.length >= 3) {
      currentHost = parts[0]; // admin or portal
    } else {
      currentHost = "main";
    }
  }

  const { pathname } = url;

  // 2. Domain Isolation & Clean URLs Logic

  if (currentHost === "admin") {
    // Redirect root / to /dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Strip /admin prefix if accessed externally
    if (pathname.startsWith("/admin")) {
      const cleanPath = pathname.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(new URL(cleanPath, req.url));
    }

    // Rewrite all other paths internally to /admin/*
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
    // Strip /portal prefix if accessed externally
    if (pathname.startsWith("/portal")) {
      const cleanPath = pathname.replace(/^\/portal/, "") || "/";
      return NextResponse.redirect(new URL(cleanPath, req.url));
    }

    // Rewrite all other paths internally to /portal/*
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
    // Block main domain from accessing subdomain paths directly
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
