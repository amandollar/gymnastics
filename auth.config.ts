import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { buildAppUrl, getAppHost } from "@/lib/utils/host";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const role = (auth?.user as { role?: string })?.role;

      const hostname = request.headers.get("host") || "";
      const currentHost = getAppHost(hostname);

      const redirectTo = (targetHost: "main" | "admin" | "portal", targetPath: string) =>
        NextResponse.redirect(buildAppUrl(nextUrl, hostname, targetHost, targetPath));

      let logicalPath = pathname;
      if (currentHost === "admin" && !pathname.startsWith("/admin")) {
        logicalPath = `/admin${pathname === "/" ? "/dashboard" : pathname}`;
      } else if (currentHost === "portal" && !pathname.startsWith("/portal")) {
        logicalPath = `/portal${pathname === "/" ? "" : pathname}`;
      }

      const isAdminRoute = logicalPath.startsWith("/admin");
      const isAdminLoginRoute = logicalPath === "/admin/login";
      const isPortalRoute = logicalPath.startsWith("/portal");
      const isPortalLoginRoute = logicalPath === "/portal/login";
      const isSettingsRoute = logicalPath === "/admin/settings";
      const requiresManageAccess =
        logicalPath === "/admin/students" ||
        logicalPath.startsWith("/admin/students/") ||
        logicalPath === "/admin/enquiries" ||
        logicalPath.startsWith("/admin/enquiries/") ||
        logicalPath === "/admin/plans" ||
        logicalPath.startsWith("/admin/plans/");

      if (isPortalRoute) {
        if (isPortalLoginRoute) {
          if (isLoggedIn) {
            if (role === "PARENT") {
              return redirectTo("portal", "/");
            }
            return redirectTo("admin", "/dashboard");
          }
          return true;
        }

        if (!isLoggedIn) {
          return redirectTo("portal", "/login");
        }

        if (role !== "PARENT") {
          return redirectTo("admin", "/dashboard");
        }

        return true;
      }

      if (isAdminRoute) {
        if (isAdminLoginRoute) {
          if (isLoggedIn) {
            if (role === "PARENT") {
              return redirectTo("portal", "/");
            }
            return redirectTo("admin", "/dashboard");
          }
          return true;
        }

        if (!isLoggedIn) {
          return redirectTo("admin", "/login");
        }

        if (role === "PARENT") {
          return redirectTo("portal", "/");
        }

        if (isSettingsRoute && role !== "ADMIN") {
          return redirectTo("admin", "/dashboard");
        }

        if (requiresManageAccess && role !== "ADMIN" && role !== "STAFF") {
          return redirectTo("admin", "/dashboard");
        }

        if (logicalPath === "/admin") {
          return redirectTo("admin", "/dashboard");
        }

        return true;
      }

      if (logicalPath === "/") {
        return true;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
