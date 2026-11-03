import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { getTableColumns, getTableName } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import type { MySql2Database } from "drizzle-orm/mysql2";
import path from "node:path";
import { botProjects, discordUserCache, users } from "../drizzle/schema";
import {
  baselineMigrationsIfNeeded,
  DatabaseConnectionError,
  isMissingTableError,
  migrationsFolder,
  pingDatabase,
  sanitizeDatabaseUrl,
  shouldAutoMigrate,
} from "./db";

afterEach(() => vi.unstubAllEnvs());

/** The rows the app's own schema would produce in information_schema.COLUMNS. */
function schemaColumns(): { t: string; c: string }[] {
  return [users, botProjects, discordUserCache].flatMap(table => {
    const name = getTableName(table);
    return Object.values(getTableColumns(table)).map(
      (column: { name: string }) => ({
        t: name,
        c: column.name,
      })
    );
  });
}

/**
 * A minimal stand-in for the drizzle handle: it records the SQL it is asked to
 * run and answers from the supplied handlers. This keeps the baseline test
 * offline (CI has no MySQL) while exercising the real code path.
 */
function fakeDb(
  handlers: {
    match: RegExp;
    rows?: unknown[];
    error?: unknown;
  }[]
) {
  const calls: string[] = [];
  const db = {
    execute: async (query: { queryChunks: unknown[] }) => {
      const text = query.queryChunks
        .map(chunk => {
          if (typeof chunk === "string" || typeof chunk === "number") {
            return String(chunk);
          }
          const value = (chunk as { value?: unknown }).value;
          return Array.isArray(value) ? value.join("") : String(value ?? "");
        })
        .join("");
      calls.push(text);
      const handler = handlers.find(h => h.match.test(text));
      if (handler?.error) throw handler.error;
      return [handler?.rows ?? [], []];
    },
  } as unknown as MySql2Database<Record<string, never>>;
  return { db, calls };
}

const HISTORY = /SELECT 1 FROM __drizzle_migrations/;
const COLUMNS = /information_schema\.COLUMNS/;
const INSERT = /INSERT INTO __drizzle_migrations/;
const MISSING = { cause: { code: "ER_NO_SUCH_TABLE" } };

describe("sanitizeDatabaseUrl", () => {
  it("removes the password while keeping the rest of the connection string", () => {
    const sanitized = sanitizeDatabaseUrl(
      "mysql://bot_user:super-secret@localhost:3306/discord_bot_builder"
    );
    expect(sanitized).not.toContain("super-secret");
    expect(sanitized).toContain("bot_user");
    expect(sanitized).toContain("localhost:3306/discord_bot_builder");
  });

  it("does not throw on an unparseable URL", () => {
    expect(sanitizeDatabaseUrl("not a url")).toBe("<unparseable DATABASE_URL>");
  });
});

describe("database configuration errors", () => {
  it("reports a missing DATABASE_URL with an actionable message", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(pingDatabase()).rejects.toThrow(DatabaseConnectionError);
    await expect(pingDatabase()).rejects.toThrow(/DATABASE_URL is not set/);
  });

  it("reports an unreachable host with a sanitized URL and no password", async () => {
    // Port 1 is reserved and never listening, so the connection fails fast.
    vi.stubEnv(
      "DATABASE_URL",
      "mysql://bot_user:hunter2@127.0.0.1:1/discord_bot_builder"
    );
    const error = await pingDatabase().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DatabaseConnectionError);
    const message = (error as Error).message;
    expect(message).toContain("127.0.0.1:1/discord_bot_builder");
    expect(message).not.toContain("hunter2");
    expect((error as Error).cause).toBeDefined();
  });
});

describe("migrationsFolder", () => {
  it("resolves to the repository migrations directory", () => {
    const folder = migrationsFolder();
    expect(path.basename(folder)).toBe("drizzle");
    expect(existsSync(path.join(folder, "meta", "_journal.json"))).toBe(true);
  });
});

describe("shouldAutoMigrate", () => {
  it("is on by default so a fresh database is initialised", () => {
    vi.stubEnv("DB_AUTO_MIGRATE", "");
    expect(shouldAutoMigrate()).toBe(true);
  });

  it("can be disabled when the schema is managed elsewhere", () => {
    vi.stubEnv("DB_AUTO_MIGRATE", "false");
    expect(shouldAutoMigrate()).toBe(false);
  });
});

describe("isMissingTableError", () => {
  it("recognises the server's missing-table error code", () => {
    expect(isMissingTableError({ cause: { code: "ER_NO_SUCH_TABLE" } })).toBe(
      true
    );
  });

  it("does not treat other failures as a missing table", () => {
    expect(
      isMissingTableError({ cause: { code: "ER_ACCESS_DENIED_ERROR" } })
    ).toBe(false);
    expect(isMissingTableError(new Error("connection lost"))).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
  });
});

describe("baselineMigrationsIfNeeded", () => {
  it("adopts the latest committed migration when the history table is absent", async () => {
    const { db, calls } = fakeDb([
      { match: HISTORY, error: MISSING },
      { match: COLUMNS, rows: schemaColumns() },
      { match: INSERT, rows: [] },
    ]);
    await expect(baselineMigrationsIfNeeded(db)).resolves.toBe(true);
    const latest = readMigrationFiles({ migrationsFolder: migrationsFolder() });
    const last = latest[latest.length - 1];
    const inserted = calls.find(call => INSERT.test(call))!;
    expect(inserted).toContain(String(last.folderMillis));
    expect(inserted).toContain(last.hash);
  });

  it("baselines an empty history table left by an interrupted first migration", async () => {
    const { db, calls } = fakeDb([
      { match: HISTORY, rows: [] },
      { match: COLUMNS, rows: schemaColumns() },
      { match: INSERT, rows: [] },
    ]);
    await expect(baselineMigrationsIfNeeded(db)).resolves.toBe(true);
    expect(calls.some(call => INSERT.test(call))).toBe(true);
  });

  it("does nothing when migration history already has rows", async () => {
    const { db, calls } = fakeDb([{ match: HISTORY, rows: [{ "1": 1 }] }]);
    await expect(baselineMigrationsIfNeeded(db)).resolves.toBe(false);
    expect(calls.some(call => INSERT.test(call))).toBe(false);
  });

  it("does nothing when the schema is incomplete", async () => {
    const partial = schemaColumns().filter(row => row.c !== "openId");
    const { db, calls } = fakeDb([
      { match: HISTORY, error: MISSING },
      { match: COLUMNS, rows: partial },
    ]);
    await expect(baselineMigrationsIfNeeded(db)).resolves.toBe(false);
    expect(calls.some(call => INSERT.test(call))).toBe(false);
  });

  it("propagates errors other than a missing history table", async () => {
    const { db } = fakeDb([
      { match: HISTORY, error: { cause: { code: "ER_ACCESS_DENIED_ERROR" } } },
    ]);
    await expect(baselineMigrationsIfNeeded(db)).rejects.toBeTruthy();
  });
});
