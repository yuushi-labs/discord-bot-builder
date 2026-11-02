import { describe, it, expect, vi, afterEach } from "vitest";
import { getLoginUrl } from "./const";
import { DISCORD_OAUTH_STATE_COOKIE } from "@shared/const";

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const entry = document.cookie
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : undefined;
}

describe("getLoginUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    document.cookie = `${DISCORD_OAUTH_STATE_COOKIE}=; max-age=0; path=/`;
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

  it("issues an unpredictable state bound to the browser", () => {
    vi.stubEnv("VITE_DISCORD_CLIENT_ID", "123456789012345678");

    const first = new URL(getLoginUrl()).searchParams.get("state");
    const second = new URL(getLoginUrl()).searchParams.get("state");

    expect(first).toBeTruthy();
    expect(first).not.toBe(second);

    // The cookie stores "<state>:<encoded redirect uri>" for the callback.
    const stored = readCookie(DISCORD_OAUTH_STATE_COOKIE) ?? "";
    const separator = stored.indexOf(":");
    expect(stored.slice(0, separator)).toBe(second);
    expect(decodeURIComponent(stored.slice(separator + 1))).toBe(
      `${window.location.origin}/api/discord/callback`
    );
  });
});
