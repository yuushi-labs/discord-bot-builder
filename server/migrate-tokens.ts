import "dotenv/config";
import { pathToFileURL } from "node:url";
import mysql, { type Connection, type RowDataPacket } from "mysql2/promise";
import {
  decryptToken,
  encryptToken,
  isEncryptedToken,
  tokenKey,
} from "./token-crypto";

/** Migrate both token columns atomically; locks prevent concurrent writes from being lost. */
export async function migrateTokens(connection: Connection) {
  tokenKey();
  await connection.beginTransaction();
  try {
    const [projects] = await connection.query<RowDataPacket[]>(
      "SELECT id, userId, discordToken FROM bot_projects FOR UPDATE"
    );
    const [cache] = await connection.query<RowDataPacket[]>(
      "SELECT id, userId, accessToken FROM discord_user_cache WHERE accessToken IS NOT NULL FOR UPDATE"
    );
    let migrated = 0;
    for (const [rows, table, column, purpose] of [
      [projects, "bot_projects", "discordToken", "bot"],
      [cache, "discord_user_cache", "accessToken", "oauth"],
    ] as const) {
      for (const row of rows) {
        const value = row[column] as string;
        if (isEncryptedToken(value)) {
          // Verify the configured key before committing any updates.
          decryptToken(value, row.userId, purpose);
        } else {
          await connection.execute(
            `UPDATE ${table} SET ${column} = ? WHERE id = ?`,
            [encryptToken(value, row.userId, purpose), row.id]
          );
          migrated++;
        }
      }
    }
    await connection.commit();
    return migrated;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  tokenKey();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    console.log(`Migrated ${await migrateTokens(connection)} token(s).`);
  } finally {
    await connection.end();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    console.error(
      "Token migration failed. Check the key and database configuration; no changes were committed."
    );
    process.exitCode = 1;
  });
}
