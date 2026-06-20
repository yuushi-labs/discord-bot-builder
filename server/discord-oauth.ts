import { ENV } from "./_core/env";
import axios from "axios";
import { upsertUser } from "./db";
import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import * as jose from "jose";

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
export async function exchangeDiscordCode(code: string, redirectUri: string): Promise<DiscordTokenResponse> {
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
export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
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

/**
 * Handle Discord OAuth callback
 */
export async function handleDiscordCallback(req: Request, res: Response) {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/discord/callback`;

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
    console.error("Discord OAuth error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
