import { int, json, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Discord Bot Projects table.
 * Stores user-created bot projects with Discord token and Blockly workspace data.
 */
export const botProjects = mysqlTable("bot_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  discordToken: text("discordToken").notNull(),
  blocklyWorkspace: longtext("blocklyWorkspace"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BotProject = typeof botProjects.$inferSelect;
export type InsertBotProject = typeof botProjects.$inferInsert;

/**
 * Discord User Info Cache table.
 * Caches Discord guild and member data from OAuth2 for quick access.
 */
export const discordUserCache = mysqlTable("discord_user_cache", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  discordId: varchar("discordId", { length: 64 }).notNull(),
  discordUsername: varchar("discordUsername", { length: 255 }).notNull(),
  guildsData: json("guildsData"),
  membersData: json("membersData"),
  accessToken: text("accessToken"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiscordUserCache = typeof discordUserCache.$inferSelect;
export type InsertDiscordUserCache = typeof discordUserCache.$inferInsert;