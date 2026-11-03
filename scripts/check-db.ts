import "dotenv/config";
import { closeDb, hasSchema, pingDatabase } from "../server/db";

pingDatabase()
  .then(async () => {
    if (await hasSchema()) {
      console.log("Database connection OK (schema ready)");
      return;
    }
    console.error(
      "Database connected, but the tables are missing. " +
        "Run `pnpm run db:push` to create the schema."
    );
    process.exitCode = 1;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
