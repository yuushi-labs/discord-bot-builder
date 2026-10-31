import { describe, it, expect } from "vitest";
import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import { DISCORD_OAUTH_STATE_COOKIE } from "../shared/const";
import { handleDiscordCallback } from "./discord-oauth";

function createRes() {
  const result: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
    clearCookie() {
      return this;
    },
    cookie() {
      return this;
    },
    redirect() {
      return this;
    },
  } as unknown as Response;
  return { res, result };
}

function createReq(query: Record<string, unknown>, cookie?: string) {
  return {
    query,
    protocol: "https",
    headers: cookie ? { cookie } : {},
    get: () => "example.com",
  } as unknown as Request;
}

describe("Discord OAuth callback state validation", () => {
  it("rejects a callback without an authorization code", async () => {
    const { res, result } = createRes();
    await handleDiscordCallback(createReq({}), res);
    expect(result.status).toBe(400);
  });

  it("rejects a callback with no state", async () => {
    const { res, result } = createRes();
    await handleDiscordCallback(createReq({ code: "abc" }), res);
    expect(result.status).toBe(403);
  });

  it("rejects a callback whose state does not match the cookie", async () => {
    const { res, result } = createRes();
    const req = createReq(
      { code: "abc", state: "attacker" },
      `${DISCORD_OAUTH_STATE_COOKIE}=expected`
    );
    await handleDiscordCallback(req, res);
    expect(result.status).toBe(403);
  });

  it("rejects a callback with a state but no cookie", async () => {
    const { res, result } = createRes();
    await handleDiscordCallback(createReq({ code: "abc", state: "x" }), res);
    expect(result.status).toBe(403);
  });
});

describe("Discord OAuth Configuration", () => {
  it("should have Discord Client ID configured", () => {
    expect(ENV.discordClientId).toBeTruthy();
    expect(ENV.discordClientId.length).toBeGreaterThan(0);
  });

  it("should have Discord Client Secret configured", () => {
    expect(ENV.discordClientSecret).toBeTruthy();
    expect(ENV.discordClientSecret.length).toBeGreaterThan(0);
  });

  it("should have JWT Secret configured", () => {
    expect(ENV.jwtSecret).toBeTruthy();
    expect(ENV.jwtSecret.length).toBeGreaterThan(0);
  });

  it("Discord Client ID should be a valid snowflake", () => {
    // Discord IDs are typically numeric strings
    expect(/^\d+$/.test(ENV.discordClientId)).toBe(true);
  });
});
