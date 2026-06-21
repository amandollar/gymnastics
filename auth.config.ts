import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const role = (auth?.user as { role?: string })?.role;

      const isAdminRoute = pathname.startsWith("/admin");
      const isAdminLoginRoute = pathname === "/admin/login";
      const isParentRoute = pathname.startsWith("/parents");
      const isParentLoginRoute = pathname === "/parents/login";
      const isSettingsRoute = pathname === "/admin/settings";
      const requiresManageAccess =
        pathname === "/admin/students" ||
        pathname.startsWith("/admin/students/") ||
        pathname === "/admin/enquiries" ||
        pathname.startsWith("/admin/enquiries/") ||
        pathname === "/admin/plans" ||
        pathname.startsWith("/admin/plans/");

      // If accessing a parent route
      if (isParentRoute) {
        if (isParentLoginRoute) {
          if (isLoggedIn) {
            if (role === "PARENT") {
              return Response.redirect(new URL("/parents", nextUrl));
            } else {
              return Response.redirect(new URL("/admin/dashboard", nextUrl));
            }
          }
          return true; // allow unauthenticated access to parent login page
        }

        // For other parent routes, require logged-in parent
        if (!isLoggedIn) {
          return Response.redirect(new URL("/parents/login", nextUrl));
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
              return Response.redirect(new URL("/parents", nextUrl));
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
          return Response.redirect(new URL("/parents", nextUrl));
        }

        if (isSettingsRoute && role !== "ADMIN") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }

        if (requiresManageAccess && role !== "ADMIN" && role !== "MANAGER") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }

        if (pathname === "/admin") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }

        return true;
      }

      // Keep the academy website public even for logged-in users.
      // Role-based redirects only apply inside protected app sections.
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
  },
  providers: [],
} satisfies NextAuthConfig;


