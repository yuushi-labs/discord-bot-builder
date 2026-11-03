import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import express from "express";
import type { Server } from "node:http";
import axios from "axios";
import { startDiscordLogin, handleDiscordCallback } from "./discord-oauth";
import { upsertUser } from "./db";

vi.mock("axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock("./db", () => ({ upsertUser: vi.fn() }));
let server: Server;
let base: string;
beforeAll(async () => {
  const app = express();
  app.get("/api/discord/login", startDiscordLogin);
  app.get("/api/discord/callback", handleDiscordCallback);
  server = await new Promise<Server>(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));
afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(axios.post).mockResolvedValue({
    data: { access_token: "synthetic-access" },
  });
  vi.mocked(axios.get).mockResolvedValue({
    data: { id: "42", username: "Test", email: "test@example.invalid" },
  });
});

describe("Discord OAuth state", () => {
  it("rejects missing and mismatched state before contacting Discord", async () => {
    const missing = await fetch(`${base}/api/discord/callback?code=test`, {
      redirect: "manual",
    });
    expect(missing.status).toBe(403);
    const login = await fetch(`${base}/api/discord/login`, {
      redirect: "manual",
    });
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const mismatch = await fetch(
      `${base}/api/discord/callback?code=test&state=${"a".repeat(43)}`,
      { headers: { cookie }, redirect: "manual" }
    );
    expect(mismatch.status).toBe(403);
    expect(mismatch.headers.get("set-cookie")).toContain(
      "Expires=Thu, 01 Jan 1970"
    );
    expect(axios.post).not.toHaveBeenCalled();
  });
  it("accepts a matching state and clears it on callback", async () => {
    const login = await fetch(`${base}/api/discord/login`, {
      redirect: "manual",
    });
    const cookieHeader = login.headers.get("set-cookie")!;
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("SameSite=Lax");
    const state = new URL(login.headers.get("location")!).searchParams.get(
      "state"
    );
    const response = await fetch(
      `${base}/api/discord/callback?code=test&state=${state}`,
      { headers: { cookie: cookieHeader.split(";")[0] }, redirect: "manual" }
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/dashboard");
    expect(response.headers.get("set-cookie")).toContain(
      "Expires=Thu, 01 Jan 1970"
    );
    expect(upsertUser).toHaveBeenCalledOnce();
    const replay = await fetch(
      `${base}/api/discord/callback?code=test&state=${state}`,
      { redirect: "manual" }
    );
    expect(replay.status).toBe(403);
    expect(axios.post).toHaveBeenCalledOnce();
  });
  it("requires a fixed production callback and uses it behind a proxy", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OAUTH_CALLBACK_URL", "");
    const missing = await fetch(`${base}/api/discord/login`, { redirect: "manual" });
    expect(missing.status).toBe(503);
    vi.stubEnv("OAUTH_CALLBACK_URL", "https://public.example/api/discord/callback");
    const login = await fetch(`${base}/api/discord/login`, { redirect: "manual" });
    const location = new URL(login.headers.get("location")!);
    expect(location.searchParams.get("redirect_uri")).toBe("https://public.example/api/discord/callback");
    await fetch(`${base}/api/discord/callback?code=test&state=${location.searchParams.get("state")}`, {
      headers: { cookie: login.headers.get("set-cookie")!.split(";")[0] }, redirect: "manual"
    });
    expect(axios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect_uri: "https://public.example/api/discord/callback" }), expect.anything());
  });

});
