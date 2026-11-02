import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, botProjects, discordUserCache, BotProject, DiscordUserCache, InsertBotProject, InsertDiscordUserCache } from "../drizzle/schema";
import { ENV } from './_core/env';
import { encryptToken, decryptToken } from './token-crypto';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

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
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Bot Projects
export async function getBotProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({ id: botProjects.id, userId: botProjects.userId, name: botProjects.name,
    blocklyWorkspace: botProjects.blocklyWorkspace, createdAt: botProjects.createdAt, updatedAt: botProjects.updatedAt,
  }).from(botProjects).where(eq(botProjects.userId, userId));
}

export async function getBotProjectById(projectId: number, userId: number): Promise<BotProject | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  if (!db) throw new Error("Database not available");
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
  if (!db) throw new Error("Database not available");
  return db
    .update(botProjects)
    .set(data)
    .where(and(eq(botProjects.id, projectId), eq(botProjects.userId, userId)));
}

export async function deleteBotProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .delete(botProjects)
    .where(and(eq(botProjects.id, projectId), eq(botProjects.userId, userId)));
}

// Discord User Cache
export async function getDiscordUserCache(userId: number): Promise<DiscordUserCache | undefined> {
  const db = await getDb();
  if (!db) return undefined;
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
  if (!db) throw new Error("Database not available");
  const encryptedData = { ...discordData, accessToken: discordData.accessToken == null ? discordData.accessToken : encryptToken(discordData.accessToken, userId, "oauth") };
  return db
    .insert(discordUserCache)
    .values({ userId, ...encryptedData })
    .onDuplicateKeyUpdate({
      set: encryptedData,
    });
}
