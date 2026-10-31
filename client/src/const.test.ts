import { describe, it, expect, vi, afterEach } from "vitest";
import { getLoginUrl } from "./const";

describe("getLoginUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when VITE_DISCORD_CLIENT_ID is not configured", () => {
    vi.stubEnv("VITE_DISCORD_CLIENT_ID", "");
    expect(() => getLoginUrl()).toThrow();
  });

  it("builds a Discord authorize URL using the current origin", () => {
    vi.stubEnv("VITE_DISCORD_CLIENT_ID", "123456789012345678");

    const url = new URL(getLoginUrl());
    expect(url.origin + url.pathname).toBe(
      "https://discord.com/api/oauth2/authorize"
    );
    expect(url.searchParams.get("client_id")).toBe("123456789012345678");
    expect(url.searchParams.get("redirect_uri")).toBe(
      `${window.location.origin}/api/discord/callback`
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("identify email");
  });
});
