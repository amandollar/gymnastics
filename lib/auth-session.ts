/**
 * auth-session.ts
 *
 * React.cache() wrapper around auth() so the JWT is decoded exactly once per
 * server-request, regardless of how many Server Components call getSession().
 *
 * Why this exists:
 *  - Next.js App Router renders the layout AND the page in the same request.
 *  - Without caching, auth() would decode the JWT twice (layout + page).
 *  - React.cache() deduplicates across the entire component tree for a single
 *    request, making the second (and any further) call a no-op.
 */
import { cache } from "react";
import { auth } from "@/auth";

export type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

export const getSession = cache(async () => {
  return auth();
});

/**
 * Reads the session and returns a typed user with role.
 * Returns null when no session exists.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
});

/**
 * Convenience helper — returns whether the current user can manage resources
 * (ADMIN or MANAGER role).
 */
export const getCanManage = cache(async (): Promise<boolean> => {
  const user = await getSessionUser();
  return user?.role === "ADMIN" || user?.role === "STAFF";
});
