import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

/** The key is separate from the session signing secret and must be stable across restarts. */
export function tokenKey(): Buffer {
  const encoded = process.env.TOKEN_ENCRYPTION_KEY ?? "";
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encoded)) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a base64 encoded 32-byte key"
    );
  }
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32 || key.toString("base64") !== encoded) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a base64 encoded 32-byte key"
    );
  }
  return key;
}

export function isEncryptedToken(value: string): boolean {
  return value.startsWith(PREFIX);
}

function associatedData(userId: number, purpose: "bot" | "oauth"): Buffer {
  return Buffer.from(`discord-bot-builder:${purpose}:${userId}`, "utf8");
}

export function encryptToken(
  value: string,
  userId: number,
  purpose: "bot" | "oauth"
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  cipher.setAAD(associatedData(userId, purpose));
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return (
    PREFIX +
    Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64")
  );
}

export function decryptToken(
  value: string,
  userId: number,
  purpose: "bot" | "oauth"
): string {
  if (!isEncryptedToken(value)) {
    throw new Error(
      "Unencrypted token found; run pnpm tokens:migrate before using this project"
    );
  }
  const data = Buffer.from(value.slice(PREFIX.length), "base64");
  if (
    data.length < 28 ||
    data.toString("base64") !== value.slice(PREFIX.length)
  ) {
    throw new Error("Invalid encrypted token");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    tokenKey(),
    data.subarray(0, 12)
  );
  decipher.setAAD(associatedData(userId, purpose));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([
    decipher.update(data.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
}
