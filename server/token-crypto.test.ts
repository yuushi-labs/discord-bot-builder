import { afterEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { encryptToken, decryptToken, isEncryptedToken } from "./token-crypto";

const key = () => randomBytes(32).toString("base64");
afterEach(() => vi.unstubAllEnvs());

describe("token encryption", () => {
  it("uses distinct nonces and binds ciphertext to its owner and purpose", () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", key());
    const first = encryptToken("synthetic-token", 42, "bot");
    const second = encryptToken("synthetic-token", 42, "bot");
    expect(first).not.toContain("synthetic-token");
    expect(first).not.toBe(second);
    expect(isEncryptedToken(first)).toBe(true);
    expect(decryptToken(first, 42, "bot")).toBe("synthetic-token");
    expect(() => decryptToken(first, 43, "bot")).toThrow();
    expect(() => decryptToken(first, 42, "oauth")).toThrow();
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", key());
    expect(() => decryptToken(first, 42, "bot")).toThrow();
  });
  it("rejects missing keys, legacy plaintext, and modified ciphertext", () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "");
    expect(() => encryptToken("token", 1, "bot")).toThrow(
      /TOKEN_ENCRYPTION_KEY/
    );
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", key());
    const encrypted = encryptToken("token", 1, "bot");
    const bytes = Buffer.from(encrypted.slice("enc:v1:".length), "base64");
    bytes[bytes.length - 1] ^= 1;
    expect(() =>
      decryptToken("enc:v1:" + bytes.toString("base64"), 1, "bot")
    ).toThrow();
    expect(() => decryptToken("legacy-token", 1, "bot")).toThrow(
      /tokens:migrate/
    );
  });
});
