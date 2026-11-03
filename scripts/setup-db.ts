import "dotenv/config";
import { pathToFileURL } from "node:url";
import mysql from "mysql2/promise";

/**
 * Create the application database and user described by DATABASE_URL, then grant
 * the user access to that database. Intended for local/self-hosted MySQL where
 * "Access denied for user '<user>'@'<host>'" usually means the user was never
 * created or the password differs from the one in DATABASE_URL.
 *
 * The DATABASE_URL credentials are authoritative: the user name and password are
 * taken from it, so the app can connect immediately afterwards. Connect as an
 * administrative user with ADMIN_DATABASE_URL (defaults to root@localhost).
 */

const IDENTIFIER = /^[A-Za-z0-9_]+$/;

export function parseDatabaseUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Do not echo the URL: it can embed the password.
    throw new Error(
      "Invalid DATABASE_URL: expected mysql://user:password@host:port/database"
    );
  }
  const database = parsed.pathname.replace(/^\//, "");
  const host = parsed.hostname || "localhost";
  const user = decodeURIComponent(parsed.username || "");
  const password = decodeURIComponent(parsed.password || "");
  const port = parsed.port || "3306";
  if (!database) throw new Error("DATABASE_URL must include a database name");
  if (!user) throw new Error("DATABASE_URL must include a user name");
  if (!password) {
    throw new Error(
      "DATABASE_URL must include a password. Refusing to create a passwordless MySQL account."
    );
  }
  return { host, port, user, password, database };
}

/**
 * MySQL matches an account's host against the connecting client, not the server
 * address in DATABASE_URL. Loopback clients can present as "localhost",
 * "127.0.0.1" or "::1" (for example when skip_name_resolve is enabled), so
 * provision all three. Remote clients come from an address the script cannot
 * know, so "any host" is the only workable default. Override with
 * DB_ACCOUNT_HOST when it is known.
 */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function resolveAccountHosts(
  serverHost: string,
  override?: string
): string[] {
  if (override) return [override];
  return LOOPBACK_HOSTS.has(serverHost)
    ? ["localhost", "127.0.0.1", "::1"]
    : ["%"];
}

/**
 * A database-level GRANT treats "_" and "%" as wildcards unless partial_revokes
 * is enabled, which would grant access to similarly named databases. Escape them
 * before quoting. The database name is validated separately, so only "_" can occur.
 */
export function escapeGrantDatabase(database: string): string {
  return mysql.escapeId(database.replace(/([_%])/g, "\\$1"));
}

export async function setupDatabase(
  adminUrl: string,
  appUrl: string,
  accountHost?: string
) {
  const target = parseDatabaseUrl(appUrl);
  if (!IDENTIFIER.test(target.database)) {
    throw new Error(
      `Unsafe database name "${target.database}"; use only letters, digits and underscores`
    );
  }
  const grantHosts = resolveAccountHosts(target.host, accountHost);

  const connection = await mysql.createConnection(adminUrl);
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(target.database)} ` +
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    // Scope each account to a client host the application may connect from.
    const grantDatabase = escapeGrantDatabase(target.database);
    for (const grantHost of grantHosts) {
      const account = `${mysql.escape(target.user)}@${mysql.escape(grantHost)}`;
      await connection.query(
        `CREATE USER IF NOT EXISTS ${account} IDENTIFIED BY ${mysql.escape(target.password)}`
      );
      await connection.query(
        `ALTER USER ${account} IDENTIFIED BY ${mysql.escape(target.password)}`
      );
      await connection.query(
        `GRANT ALL PRIVILEGES ON ${grantDatabase}.* TO ${account}`
      );
    }
    await connection.query("FLUSH PRIVILEGES");
  } finally {
    await connection.end();
  }

  return { ...target, grantHosts };
}

async function main() {
  const appUrl = process.env.DATABASE_URL;
  if (!appUrl) throw new Error("DATABASE_URL is required");
  const adminUrl =
    process.env.ADMIN_DATABASE_URL || "mysql://root@localhost:3306";
  const target = await setupDatabase(
    adminUrl,
    appUrl,
    process.env.DB_ACCOUNT_HOST
  );
  console.log(
    `Prepared database "${target.database}" and user "${target.user}" for hosts: ` +
      `${target.grantHosts.join(", ")}. Now run: pnpm run db:push`
  );
  if (target.grantHosts.includes("%")) {
    console.warn(
      "Warning: an account that can connect from any host was created. " +
        "Restrict access with firewall/security-group rules, or set DB_ACCOUNT_HOST " +
        "to the application host."
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(error => {
    console.error(
      "Database setup failed:",
      error instanceof Error ? error.message : error
    );
    console.error(
      "Set ADMIN_DATABASE_URL to an account that can create databases and users " +
        "(default: mysql://root@localhost:3306), then try again."
    );
    process.exitCode = 1;
  });
}
