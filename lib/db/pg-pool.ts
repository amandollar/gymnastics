import { Pool } from "pg";

const LEGACY_SSL = /sslmode=(require|prefer|verify-ca)\b/gi;

/**
 * Ensures node-postgres uses explicit verify-full (avoids v9 deprecation warning).
 * Works with Neon URLs and passwords that break the URL parser.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  const url = connectionString.trim();

  if (LEGACY_SSL.test(url)) {
    return url.replace(LEGACY_SSL, "sslmode=verify-full");
  }

  if (!/sslmode=/i.test(url)) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}sslmode=verify-full`;
  }

  return url;
}

export function createPgPool(connectionString?: string): Pool {
  const raw = connectionString ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({
    connectionString: normalizeDatabaseUrl(raw),
  });
}
