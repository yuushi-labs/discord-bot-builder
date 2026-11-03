import "dotenv/config";

// This check must only report state, never change it: start.sh runs it under a
// timeout, and a migration interrupted mid-way could leave partial DDL behind.
// Force the read-only path before loading the app's database module.
process.env.DB_AUTO_MIGRATE = "false";

async function main() {
  const { closeDb, hasSchema, pingDatabase } = await import("../server/db");
  try {
    await pingDatabase();
    if (await hasSchema()) {
      console.log("Database connection OK (schema ready)");
    } else {
      console.error(
        "Database connected, but the tables are missing. " +
          "Run `pnpm run db:push` to create the schema (or start the server, " +
          "which applies migrations automatically)."
      );
      process.exitCode = 1;
    }
  } finally {
    await closeDb();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
