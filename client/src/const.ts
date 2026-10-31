export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Build the Discord OAuth2 authorization URL.
 *
 * The redirect URI is derived from the current origin so the same build works
 * on localhost and in production. The backend callback lives at
 * `/api/discord/callback` (see `server/discord-oauth.ts`).
 */
export const getLoginUrl = (): string => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_DISCORD_CLIENT_ID が設定されていません。.env を確認してください。"
    );
  }

  const redirectUri = `${window.location.origin}/api/discord/callback`;

  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");

  return url.toString();
};
