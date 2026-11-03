import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DatabaseConnectionError,
  pingDatabase,
  sanitizeDatabaseUrl,
} from "./db";

afterEach(() => vi.unstubAllEnvs());

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
