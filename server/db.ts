import { and, eq, getTableColumns, getTableName, sql } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  InsertUser,
  users,
  botProjects,
  discordUserCache,
  BotProject,
  DiscordUserCache,
  InsertBotProject,
  InsertDiscordUserCache,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { encryptToken, decryptToken } from "./token-crypto";

type Db = MySql2Database<Record<string, never>>;

let _db: Db | null = null;
let _pool: mysql.Pool | null = null;
let _connecting: Promise<Db> | null = null;

/** Strip the password so a connection string can be logged without leaking credentials. */
export function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "<unparseable DATABASE_URL>";
  }
}

/** Raised when the database is not configured or cannot be reached. */
export class DatabaseConnectionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DatabaseConnectionError";
  }
}

function missingUrlError(): DatabaseConnectionError {
  return new DatabaseConnectionError(
    "DATABASE_URL is not set. Copy .env.example to .env and point DATABASE_URL at your MySQL database, " +
      "e.g. mysql://bot_user:your_password@localhost:3306/discord_bot_builder"
  );
}

function connectionFailedError(
  url: string,
  cause: unknown
): DatabaseConnectionError {
  return new DatabaseConnectionError(
    `Could not connect to MySQL at ${sanitizeDatabaseUrl(url)}. ` +
      "Check DATABASE_URL and make sure the user exists with the expected password and privileges " +
      "(see SETUP_GUIDE.md, or create the user with `pnpm run db:setup`).",
    { cause }
  );
}

/**
 * Apply the Drizzle migrations shipped in the repository. The migrations folder
 * sits next to package.json, which resolves relative to this module both when run
 * from source (server/db.ts) and from the built bundle (dist/index.js).
 */
export function migrationsFolder(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../drizzle"
  );
}

/**
 * Auto-migration is on by default so a fresh clone works after `db:setup`.
 * Set DB_AUTO_MIGRATE=false when the schema is managed elsewhere (e.g. several
 * instances starting at once, or a migration step in the deploy pipeline).
 */
export function shouldAutoMigrate(): boolean {
  return process.env.DB_AUTO_MIGRATE !== "false";
}

/** True only for a genuine "table does not exist" error from the server. */
export function isMissingTableError(error: unknown): boolean {
  const code = (error as { cause?: { code?: string } })?.cause?.code;
  return code === "ER_NO_SUCH_TABLE";
}

/**
 * Databases created by the older manual instructions have the application tables
 * but no `__drizzle_migrations` history, so the migrator would replay `0000` and
 * fail on the existing tables. When every required table and column is already
 * present but no migration is recorded, adopt the committed migrations as the
 * baseline so only genuinely new migrations run.
 */
export async function baselineMigrationsIfNeeded(db: Db): Promise<boolean> {
  // A present-but-empty history table counts as no history: a crash between the
  // last DDL statement of a migration and its history insert leaves the schema
  // complete with nothing recorded, and replaying would fail on the live tables.
  let hasHistory = false;
  try {
    const [rows] = (await db.execute(
      sql`SELECT 1 FROM __drizzle_migrations LIMIT 1`
    )) as unknown as [unknown[], unknown];
    hasHistory = rows.length > 0;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }
  if (hasHistory) return false;
  if (!(await schemaExists(db))) return false;

  const migrations = readMigrationFiles({
    migrationsFolder: migrationsFolder(),
  });
  if (migrations.length === 0) return false;
  const latest = migrations[migrations.length - 1];
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id serial PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )`
  );
  await db.execute(
    sql`INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES (${latest.hash}, ${latest.folderMillis})`
  );
  return true;
}

/**
 * Drizzle's MySQL migrator reads the applied-migration list and then runs the
 * pending DDL without a cross-process lock, so two instances starting together
 * can run the same CREATE TABLE. A database-wide advisory lock (which is
 * released automatically when the connection closes) keeps that serialized.
 */
async function runMigrations(db: Db, pool: mysql.Pool): Promise<void> {
  const lockName = "discord_bot_builder:migrations";
  const connection = await pool.getConnection();
  try {
    const [[acquired]] = (await connection.query(
      "SELECT GET_LOCK(?, 60) AS acquired",
      [lockName]
    )) as unknown as [{ acquired: number | null }[]];
    if (!acquired?.acquired) {
      throw new Error(
        "Timed out waiting for the database migration lock; another instance is " +
          "probably migrating. Retry the start, or set DB_AUTO_MIGRATE=false."
      );
    }
    if (await baselineMigrationsIfNeeded(db)) {
      console.log(
        "[Database] Existing schema adopted as the migration baseline."
      );
    }
    await migrate(db, { migrationsFolder: migrationsFolder() });
  } finally {
    await connection
      .query("SELECT RELEASE_LOCK(?)", [lockName])
      .catch(() => {});
    connection.release();
  }
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) throw missingUrlError();

  const pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
  });
  let db: Db;
  try {
    // mysql2 pools connect lazily, so probe once to surface auth/config errors here.
    const connection = await pool.getConnection();
    connection.release();
    db = drizzle(pool);
  } catch (error) {
    await pool.end().catch(() => {});
    console.error(
      `[Database] Connection failed for ${sanitizeDatabaseUrl(url)}:`,
      error instanceof Error ? error.message : error
    );
    throw connectionFailedError(url, error);
  }

  // Apply pending migrations so a fresh database gets its tables on first run.
  // Without this, the connection succeeds but the first query fails with
  // "Table '<db>.users' doesn't exist".
  if (shouldAutoMigrate()) {
    try {
      await runMigrations(db, pool);
    } catch (error) {
      await pool.end().catch(() => {});
      console.error(
        "[Database] Migration failed:",
        error instanceof Error ? error.message : error
      );
      throw new DatabaseConnectionError(
        "Could not apply database migrations. If this database already had tables " +
          "from an older setup, its schema may not match the migrations (for " +
          "example a missing UNIQUE index); compare them and reconcile before " +
          "retrying. Otherwise check that DATABASE_URL points at the right " +
          "database and that the user can create tables, then run `pnpm run " +
          "db:push` manually.",
        { cause: error }
      );
    }
  }

  _pool = pool;
  _db = db;
  return _db;
}

interface RequiredColumn {
  name: string;
  unique: boolean;
}

interface RequiredTable {
  table: string;
  columns: RequiredColumn[];
}

/** Every table, column and unique constraint the application needs. */
function requiredSchema(): RequiredTable[] {
  return [users, botProjects, discordUserCache].map(table => ({
    table: getTableName(table),
    columns: Object.values(getTableColumns(table)).map(column => {
      const { name, isUnique, primary } = column as unknown as {
        name: string;
        isUnique?: boolean;
        primary?: boolean;
      };
      return { name, unique: Boolean(isUnique || primary) };
    }),
  }));
}

/**
 * Verify that every table, column and unique constraint the application relies on
 * actually exists, so callers can tell "connected" from "ready". A partial schema
 * (an old `users` table without `openId`, or one missing the unique index) is
 * reported as not ready.
 */
async function schemaExists(db: Db): Promise<boolean> {
  const required = requiredSchema();
  let columns: { t: string; c: string }[];
  let uniqueIndexes: { t: string; c: string }[];
  try {
    // mysql2 returns a [rows, fields] tuple from execute().
    [columns] = (await db.execute(
      sql`SELECT TABLE_NAME AS t, COLUMN_NAME AS c
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()`
    )) as unknown as [{ t: string; c: string }[], unknown];
    [uniqueIndexes] = (await db.execute(
      sql`SELECT TABLE_NAME AS t, COLUMN_NAME AS c
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE() AND NON_UNIQUE = 0`
    )) as unknown as [{ t: string; c: string }[], unknown];
  } catch (error) {
    // A missing information_schema row is a missing schema; anything else (lost
    // connection, denied SELECT) is a real error and should not be masked.
    if (isMissingTableError(error)) return false;
    throw error;
  }

  const present = new Map<string, Set<string>>();
  for (const { t, c } of columns) {
    const found = present.get(t) ?? new Set<string>();
    found.add(c);
    present.set(t, found);
  }
  const unique = new Set(uniqueIndexes.map(({ t, c }) => `${t}\u0000${c}`));

  return required.every(({ table, columns: needed }) => {
    const found = present.get(table);
    if (!found) return false;
    return needed.every(
      column =>
        found.has(column.name) &&
        (!column.unique || unique.has(`${table}\u0000${column.name}`))
    );
  });
}

export async function hasSchema(): Promise<boolean> {
  return schemaExists(await getDb());
}

// Create the pool lazily on first use and reuse it afterwards.
function getDb(): Promise<Db> {
  if (!_connecting) {
    _connecting = connect().catch(error => {
      _connecting = null;
      throw error;
    });
  }
  return _connecting;
}

/** Probe the database connection, e.g. from a startup script. Throws on failure. */
export async function pingDatabase(): Promise<void> {
  await getDb();
}

/** Close the pool so the process can exit cleanly. */
export async function closeDb(): Promise<void> {
  _db = null;
  _connecting = null;
  const pool = _pool;
  _pool = null;
  if (pool) await pool.end();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Bot Projects
export async function getBotProjectsByUserId(userId: number) {
  const db = await getDb();
  return db
    .select({
      id: botProjects.id,
      userId: botProjects.userId,
      name: botProjects.name,
      blocklyWorkspace: botProjects.blocklyWorkspace,
      createdAt: botProjects.createdAt,
      updatedAt: botProjects.updatedAt,
    })
    .from(botProjects)
    .where(eq(botProjects.userId, userId));
}

export async function getBotProjectById(
  projectId: number,
  userId: number
): Promise<BotProject | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(botProjects)
    .where(and(eq(botProjects.id, projectId), eq(botProjects.userId, userId)))
    .limit(1);
  return result.length > 0
    ? {
        ...result[0],
        discordToken: decryptToken(result[0].discordToken, userId, "bot"),
      }
    : undefined;
}

export async function createBotProject(
  userId: number,
  name: string,
  discordToken: string
) {
  const db = await getDb();
  const result = await db.insert(botProjects).values({
    userId,
    name,
    discordToken: encryptToken(discordToken, userId, "bot"),
  });
  return result;
}

export async function updateBotProject(
  projectId: number,
  userId: number,
  data: Partial<Pick<InsertBotProject, "name" | "blocklyWorkspace">>
) {
  const db = await getDb();
  return db
    .update(botProjects)
    .set(data)
    .where(and(eq(botProjects.id, projectId), eq(botProjects.userId, userId)));
}

export async function deleteBotProject(projectId: number, userId: number) {
  const db = await getDb();
  return db
    .delete(botProjects)
    .where(and(eq(botProjects.id, projectId), eq(botProjects.userId, userId)));
}

// Discord User Cache
export async function getDiscordUserCache(
  userId: number
): Promise<DiscordUserCache | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(discordUserCache)
    .where(eq(discordUserCache.userId, userId))
    .limit(1);
  if (!result.length) return undefined;
  return {
    ...result[0],
    accessToken:
      result[0].accessToken === null
        ? null
        : decryptToken(result[0].accessToken, userId, "oauth"),
  };
}

export async function upsertDiscordUserCache(
  userId: number,
  discordData: Omit<InsertDiscordUserCache, "userId">
) {
  const db = await getDb();
  const encryptedData = {
    ...discordData,
    accessToken:
      discordData.accessToken == null
        ? discordData.accessToken
        : encryptToken(discordData.accessToken, userId, "oauth"),
  };
  return db
    .insert(discordUserCache)
    .values({ userId, ...encryptedData })
    .onDuplicateKeyUpdate({
      set: encryptedData,
    });
}
