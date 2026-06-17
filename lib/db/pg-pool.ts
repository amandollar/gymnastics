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

// Singleton pool cached on global so warm serverless invocations reuse the
// same TCP connection pool instead of creating a new one per request.
const globalForPg = global as unknown as { pgPool?: Pool };

export function createPgPool(connectionString?: string): Pool {
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }

  const raw = connectionString ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString: normalizeDatabaseUrl(raw),
    // Keep up to 10 idle connections alive so subsequent requests don't pay
    // the TCP + TLS handshake cost to Neon.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Log unexpected errors on idle pg clients to prevent unhandled process crashes.
  // The pool automatically evicts the broken client, so no further recovery is needed.
  pool.on("error", (err) => {
    console.error("Unexpected error on idle pg client:", err);
  });

  globalForPg.pgPool = pool;
  return pool;
}
