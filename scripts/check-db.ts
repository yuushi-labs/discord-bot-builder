import "dotenv/config";
import { pingDatabase, closeDb } from "../server/db";

pingDatabase()
  .then(() => {
    console.log("Database connection OK");
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
