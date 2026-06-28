import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database successfully. Fetching active connections and locks...");

    // Query active connections
    const connRes = await client.query(`
      SELECT pid, state, query, age(clock_timestamp(), query_start) as duration
      FROM pg_stat_activity
      WHERE state IS NOT NULL AND pid <> pg_backend_pid();
    `);
    console.log("\n--- Active Connections ---");
    console.table(connRes.rows);

    // Query active locks
    const locksRes = await client.query(`
      SELECT locktype, mode, granted, pid, classid, objid
      FROM pg_locks
      WHERE objid = 617901231 OR classid = 617901231;
    `);
    console.log("\n--- Active Advisory Locks ---");
    console.table(locksRes.rows);

  } catch (e) {
    console.error("Error checking database:", e);
  } finally {
    await client.end();
  }
}

run();
