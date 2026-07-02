import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

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
      const pathname =
        nextUrl.pathname === "/portal" || nextUrl.pathname.startsWith("/portal/")
          ? nextUrl.pathname.replace(/^\/portal/, "/parents") || "/parents"
          : nextUrl.pathname;
      const role = (auth?.user as { role?: string })?.role;

      const redirectTo = (targetPath: string) =>
        NextResponse.redirect(new URL(targetPath, request.url));

      const isAdminRoute = pathname.startsWith("/admin");
      const isAdminLoginRoute = pathname === "/admin/login";
      const isParentsRoute = pathname.startsWith("/parents");
      const isParentsLoginRoute = pathname === "/parents/login";
      const isSettingsRoute = pathname === "/admin/settings";
      const requiresManageAccess =
        pathname === "/admin/students" ||
        pathname.startsWith("/admin/students/") ||
        pathname === "/admin/enquiries" ||
        pathname.startsWith("/admin/enquiries/") ||
        pathname === "/admin/plans" ||
        pathname.startsWith("/admin/plans/");

      if (isParentsRoute) {
        if (isParentsLoginRoute) {
          if (isLoggedIn) {
            if (role === "PARENT") {
              return redirectTo("/parents");
            }
            return redirectTo("/admin/dashboard");
          }
          return true;
        }

        if (!isLoggedIn) {
          return redirectTo("/parents/login");
        }

        if (role !== "PARENT") {
          return redirectTo("/admin/dashboard");
        }

        return true;
      }

      if (isAdminRoute) {
        if (isAdminLoginRoute) {
          if (isLoggedIn) {
            if (role === "PARENT") {
              return redirectTo("/parents");
            }
            return redirectTo("/admin/dashboard");
          }
          return true;
        }

        if (!isLoggedIn) {
          return redirectTo("/admin/login");
        }

        if (role === "PARENT") {
          return redirectTo("/parents");
        }

        if (isSettingsRoute && role !== "ADMIN" && role !== "STAFF") {
          return redirectTo("/admin/dashboard");
        }

        if (requiresManageAccess && role !== "ADMIN" && role !== "STAFF") {
          return redirectTo("/admin/dashboard");
        }

        if (pathname === "/admin") {
          return redirectTo("/admin/dashboard");
        }

        return true;
      }

      if (pathname === "/") {
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
    async redirect({ url, baseUrl }) {
      // If it's a relative path, append to baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(baseUrl);

        // Allow redirects within the same root domain (including subdomains)
        const getRootDomain = (hostname: string) => {
          if (hostname === "localhost" || hostname.endsWith(".localhost")) {
            return "localhost";
          }
          if (hostname.endsWith(".vercel.app")) {
            return hostname.split(".").slice(-3).join(".");
          }
          const parts = hostname.split(".");
          return parts.length >= 3 ? parts.slice(1).join(".") : hostname;
        };

        const urlRoot = getRootDomain(parsedUrl.hostname);
        const baseRoot = getRootDomain(parsedBase.hostname);

        // If same root domain, allow the redirect (preserves subdomain)
        if (urlRoot === baseRoot) {
          return url;
        }

        // If different domain, redirect to baseUrl (stay on current subdomain)
        return baseUrl;
      } catch (e) {
        console.error("Error in NextAuth redirect callback:", e);
        return baseUrl;
      }
    },
  },
  providers: [],
} satisfies NextAuthConfig;
