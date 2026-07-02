import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const LEGACY_SUBDOMAINS = new Set(["admin", "portal", "parents"]);

function stripPort(hostname: string) {
  const [host, port] = hostname.split(":");
  return { host, port: port ?? "" };
}

function getLegacySubdomain(hostname: string) {
  const { host } = stripPort(hostname);

  if (host === "localhost" || host.endsWith(".localhost")) {
    const parts = host.split(".");
    return parts.length > 1 && LEGACY_SUBDOMAINS.has(parts[0]) ? parts[0] : null;
  }

  if (host.endsWith(".vercel.app")) {
    const parts = host.split(".");
    return parts.length >= 4 && LEGACY_SUBDOMAINS.has(parts[0]) ? parts[0] : null;
  }

  const parts = host.split(".");
  return parts.length >= 3 && LEGACY_SUBDOMAINS.has(parts[0]) ? parts[0] : null;
}

function getRootHost(hostname: string) {
  const { host, port } = stripPort(hostname);

  if (host === "localhost" || host.endsWith(".localhost")) {
    return { host: "localhost", port };
  }

  if (host.endsWith(".vercel.app")) {
    return { host: host.split(".").slice(-3).join("."), port };
  }

  const parts = host.split(".");
  return { host: parts.length >= 3 ? parts.slice(1).join(".") : host, port };
}

function getCanonicalPath(subdomain: string, pathname: string) {
  if (subdomain === "admin") {
    if (pathname === "/") {
      return "/admin/dashboard";
    }

    return pathname.startsWith("/admin") ? pathname : `/admin${pathname}`;
  }

  if (pathname === "/") {
    return "/parents";
  }

  if (pathname.startsWith("/parents")) {
    return pathname;
  }

  if (pathname.startsWith("/portal")) {
    return pathname.replace(/^\/portal/, "/parents") || "/parents";
  }

  return `/parents${pathname}`;
}

export const proxy = auth((req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const { pathname } = url;
  const legacySubdomain = getLegacySubdomain(hostname);

  if (legacySubdomain) {
    const destination = new URL(req.url);
    const { host, port } = getRootHost(hostname);
    destination.hostname = host;
    destination.port = port;
    destination.pathname = getCanonicalPath(legacySubdomain, pathname);
    destination.search = url.search;
    return NextResponse.redirect(destination);
  }

  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    const redirectUrl = new URL(
      pathname.replace(/^\/portal/, "/parents") || "/parents",
      req.url,
    );
    redirectUrl.search = url.search;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
