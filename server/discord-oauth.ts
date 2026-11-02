import { ENV } from "./_core/env";
import axios from "axios";
import { upsertUser } from "./db";
import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import * as jose from "jose";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { parse as parseCookies } from "cookie";

const DISCORD_API_BASE = "https://discord.com/api/v10";

interface DiscordUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/**
 * Exchange Discord authorization code for access token
 */
export async function exchangeDiscordCode(
  code: string,
  redirectUri: string
): Promise<DiscordTokenResponse> {
  const response = await axios.post<DiscordTokenResponse>(
    `${DISCORD_API_BASE}/oauth2/token`,
    {
      client_id: ENV.discordClientId,
      client_secret: ENV.discordClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      scope: "identify email",
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

/**
 * Get Discord user info from access token
 */
export async function getDiscordUser(
  accessToken: string
): Promise<DiscordUser> {
  const response = await axios.get<DiscordUser>(
    `${DISCORD_API_BASE}/users/@me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
}

function stateCookie(req: Request) {
  const options = getSessionCookieOptions(req);
  return {
    name: options.secure ? "__Host-discord_oauth_state" : "discord_oauth_state",
    options: { ...options, sameSite: "lax" as const, path: "/" },
  };
}

function callbackUri(req: Request): string {
  return (
    process.env.OAUTH_CALLBACK_URL ||
    `${req.protocol}://${req.get("host")}/api/discord/callback`
  );
}

export function startDiscordLogin(req: Request, res: Response) {
  if (!ENV.discordClientId || !ENV.jwtSecret) {
    return res.status(503).send("Discord login is not configured");
  }
  const state = randomBytes(32).toString("base64url");
  const cookie = stateCookie(req);
  res.cookie(cookie.name, state, { ...cookie.options, maxAge: 10 * 60 * 1000 });
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", ENV.discordClientId);
  url.searchParams.set("redirect_uri", callbackUri(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);
  return res.redirect(url.toString());
}

/**
 * Handle Discord OAuth callback
 */
export async function handleDiscordCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;
    const cookie = stateCookie(req);
    const expected = parseCookies(req.headers.cookie || "")[cookie.name];
    res.clearCookie(cookie.name, cookie.options);
    if (
      typeof state !== "string" ||
      !expected ||
      !/^[A-Za-z0-9_-]{43}$/.test(state) ||
      !/^[A-Za-z0-9_-]{43}$/.test(expected) ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(expected))
    ) {
      return res.status(400).json({ error: "Invalid OAuth state" });
    }

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    const redirectUri = callbackUri(req);

    const tokenData = await exchangeDiscordCode(code, redirectUri);
    const discordUser = await getDiscordUser(tokenData.access_token);

    const openId = `discord_${discordUser.id}`;

    await upsertUser({
      openId,
      name: discordUser.username,
      email: discordUser.email,
      loginMethod: "discord",
      lastSignedIn: new Date(),
    });

    const secret = new TextEncoder().encode(ENV.jwtSecret);
    const token = await new jose.SignJWT({
      openId,
      appId: ENV.discordClientId,
      name: discordUser.username,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("7d")
      .sign(secret);

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Discord OAuth callback failed");
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
