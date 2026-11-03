import { and, eq } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, botProjects, discordUserCache, BotProject, DiscordUserCache, InsertBotProject, InsertDiscordUserCache } from "../drizzle/schema";
import { ENV } from './_core/env';
import { encryptToken, decryptToken } from './token-crypto';

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

function connectionFailedError(url: string, cause: unknown): DatabaseConnectionError {
  return new DatabaseConnectionError(
    `Could not connect to MySQL at ${sanitizeDatabaseUrl(url)}. ` +
      "Check DATABASE_URL and make sure the user exists with the expected password and privileges " +
      "(see SETUP_GUIDE.md, or create the user with `pnpm run db:setup`).",
    { cause }
  );
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) throw missingUrlError();

  const pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
  });
  try {
    // mysql2 pools connect lazily, so probe once to surface auth/config errors here.
    const connection = await pool.getConnection();
    connection.release();
  } catch (error) {
    await pool.end().catch(() => {});
    console.error(
      `[Database] Connection failed for ${sanitizeDatabaseUrl(url)}:`,
      error instanceof Error ? error.message : error
    );
    throw connectionFailedError(url, error);
  }

  _pool = pool;
  _db = drizzle(pool);
  return _db;
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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Bot Projects
export async function getBotProjectsByUserId(userId: number) {
  const db = await getDb();
  return db.select({ id: botProjects.id, userId: botProjects.userId, name: botProjects.name,
    blocklyWorkspace: botProjects.blocklyWorkspace, createdAt: botProjects.createdAt, updatedAt: botProjects.updatedAt,
  }).from(botProjects).where(eq(botProjects.userId, userId));
}

export async function getBotProjectById(projectId: number, userId: number): Promise<BotProject | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(botProjects)
    .where(and(eq(botProjects.id, projectId), eq(botProjects.userId, userId)))
    .limit(1);
  return result.length > 0 ? { ...result[0], discordToken: decryptToken(result[0].discordToken, userId, "bot") } : undefined;
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
export async function getDiscordUserCache(userId: number): Promise<DiscordUserCache | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(discordUserCache)
    .where(eq(discordUserCache.userId, userId))
    .limit(1);
  if (!result.length) return undefined;
  return { ...result[0], accessToken: result[0].accessToken === null ? null : decryptToken(result[0].accessToken, userId, "oauth") };
}

export async function upsertDiscordUserCache(
  userId: number,
  discordData: Omit<InsertDiscordUserCache, "userId">
) {
  const db = await getDb();
  const encryptedData = { ...discordData, accessToken: discordData.accessToken == null ? discordData.accessToken : encryptToken(discordData.accessToken, userId, "oauth") };
  return db
    .insert(discordUserCache)
    .values({ userId, ...encryptedData })
    .onDuplicateKeyUpdate({
      set: encryptedData,
    });
}
