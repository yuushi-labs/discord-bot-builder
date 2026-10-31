export {
  COOKIE_NAME,
  DISCORD_OAUTH_STATE_COOKIE,
  ONE_YEAR_MS,
} from "@shared/const";

import { DISCORD_OAUTH_STATE_COOKIE } from "@shared/const";

/** Generate an unpredictable, single-use OAuth `state` value. */
function createOAuthState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Build the Discord OAuth2 authorization URL.
 *
 * The redirect URI is derived from the current origin so the same build works
 * on localhost and in production. The backend callback lives at
 * `/api/discord/callback` (see `server/discord-oauth.ts`).
 *
 * A random `state` is generated and stored in a short-lived cookie so the
 * callback can verify the request came from this browser (CSRF protection).
 */
export const getLoginUrl = (): string => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_DISCORD_CLIENT_ID が設定されていません。.env を確認してください。"
    );
  }

  const redirectUri = `${window.location.origin}/api/discord/callback`;
  const state = createOAuthState();

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${DISCORD_OAUTH_STATE_COOKIE}=${state}; path=/; max-age=600; ` +
    `samesite=lax${secure}`;

  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);

  return url.toString();
};
