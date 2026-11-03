import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

describe("session signing secret", () => {
  it("rejects sessions and signing when the secret is missing", async () => {
    const original = ENV.cookieSecret;
    ENV.cookieSecret = "";
    try {
      const forged = await new SignJWT({ openId: "user", appId: "app", name: "test" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode("test-secret"));
      expect(await sdk.verifySession(forged)).toBeNull();
      await expect(sdk.createSessionToken("user")).rejects.toThrow(/JWT_SECRET/);
    } finally {
      ENV.cookieSecret = original;
    }
  });
});
