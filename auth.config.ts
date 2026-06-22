import type { NextAuthConfig } from "next-auth";

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
      let currentHost = hostname;
      if (currentHost.includes("localhost")) {
        currentHost = currentHost.replace(".localhost:3000", "").replace("localhost:3000", "main");
      } else {
        const parts = currentHost.split(".");
        if (parts.length >= 3) {
          currentHost = parts[0];
        } else {
          currentHost = "main";
        }
      }

      // Map clean paths back to internal logical paths for auth checks
      let logicalPath = pathname;
      if (currentHost === "admin" && !pathname.startsWith("/admin")) {
        logicalPath = `/admin${pathname === "/" ? "/dashboard" : pathname}`;
      } else if (currentHost === "portal" && !pathname.startsWith("/portal")) {
        logicalPath = `/portal${pathname === "/" ? "" : pathname}`;
      }

      const isAdminRoute = logicalPath.startsWith("/admin");
      const isAdminLoginRoute = logicalPath === "/admin/login";
      const isPortalRoute = logicalPath.startsWith("/portal");
      const isPortalLoginRoute = logicalPath === "/portal/login" || logicalPath === "/portal"; // Adjust if /portal is login
      const isSettingsRoute = logicalPath === "/admin/settings";
      const requiresManageAccess =
        logicalPath === "/admin/students" ||
        logicalPath.startsWith("/admin/students/") ||
        logicalPath === "/admin/enquiries" ||
        logicalPath.startsWith("/admin/enquiries/") ||
        logicalPath === "/admin/plans" ||
        logicalPath.startsWith("/admin/plans/");

      // If accessing a portal route
      if (isPortalRoute) {
        if (isPortalLoginRoute) {
          if (isLoggedIn) {
            if (role === "PARENT") {
              return Response.redirect(new URL("/portal", nextUrl));
            } else {
              return Response.redirect(new URL("/admin/dashboard", nextUrl));
            }
          }
          return true; // allow unauthenticated access to portal login page
        }

        // For other portal routes, require logged-in parent
        if (!isLoggedIn) {
          return Response.redirect(new URL("/portal/login", nextUrl));
        }

        if (role !== "PARENT") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }

        return true;
      }

      // If accessing an admin route
      if (isAdminRoute) {
        if (isAdminLoginRoute) {
          if (isLoggedIn) {
            if (role === "PARENT") {
              return Response.redirect(new URL("/portal", nextUrl));
            } else {
              return Response.redirect(new URL("/admin/dashboard", nextUrl));
            }
          }
          return true; // allow unauthenticated access to admin login page
        }

        // For other admin routes, require logged-in staff member
        if (!isLoggedIn) {
          return false; // this will redirect to pages.signIn which is /admin/login
        }

        if (role === "PARENT") {
          return Response.redirect(new URL("/portal", nextUrl));
        }

        if (isSettingsRoute && role !== "ADMIN") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }

        if (requiresManageAccess && role !== "ADMIN" && role !== "MANAGER") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }

        if (logicalPath === "/admin") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }

        return true;
      }

      // Keep the academy website public even for logged-in users.
      // Role-based redirects only apply inside protected app sections.
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


