import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { randomBytes } from "node:crypto";
import { migrateTokens } from "./migrate-tokens";
import { decryptToken, encryptToken } from "./token-crypto";

afterEach(() => vi.unstubAllEnvs());
function connection(projects: object[], cache: object[]) {
  return {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    query: vi
      .fn()
      .mockResolvedValueOnce([projects])
      .mockResolvedValueOnce([cache]),
    execute: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
  };
}

describe("token migration", () => {
  it("encrypts legacy tokens and preserves already encrypted tokens", async () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    const stored = encryptToken("already encrypted", 3, "bot");
    const db = connection(
      [
        { id: 1, userId: 2, discordToken: "legacy bot" },
        { id: 2, userId: 3, discordToken: stored },
      ],
      [{ id: 7, userId: 2, accessToken: "legacy oauth" }]
    );
    expect(await migrateTokens(db as unknown as Connection)).toBe(2);
    expect(db.execute).toHaveBeenCalledTimes(2);
    expect(decryptToken(db.execute.mock.calls[0][1][0], 2, "bot")).toBe(
      "legacy bot"
    );
    expect(decryptToken(db.execute.mock.calls[1][1][0], 2, "oauth")).toBe(
      "legacy oauth"
    );
    expect(db.commit).toHaveBeenCalledOnce();
    expect(db.rollback).not.toHaveBeenCalled();
  });
  it("rolls back all changes when an existing ciphertext cannot be decrypted", async () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    const stored = encryptToken("already encrypted", 3, "bot");
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    const db = connection(
      [
        { id: 1, userId: 2, discordToken: "legacy" },
        { id: 2, userId: 3, discordToken: stored },
      ],
      []
    );
    await expect(migrateTokens(db as unknown as Connection)).rejects.toThrow();
    expect(db.rollback).toHaveBeenCalledOnce();
    expect(db.commit).not.toHaveBeenCalled();
  });
});
