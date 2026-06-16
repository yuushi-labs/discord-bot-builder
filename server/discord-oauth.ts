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

interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
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
      scope: "identify email guilds guilds.members.read",
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
 * Get Discord user's guilds
 */
export async function getDiscordGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await axios.get<DiscordGuild[]>(
    `${DISCORD_API_BASE}/users/@me/guilds`,
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

    // Exchange code for token
    const tokenData = await exchangeDiscordCode(code, redirectUri);

    // Get user info
    const discordUser = await getDiscordUser(tokenData.access_token);

    // Get user's guilds
    const guilds = await getDiscordGuilds(tokenData.access_token);

    // Upsert user in database
    await upsertUser({
      openId: `discord_${discordUser.id}`,
      name: discordUser.username,
      email: discordUser.email,
      loginMethod: "discord",
      lastSignedIn: new Date(),
    });

    // Create JWT session token
    const secret = new TextEncoder().encode(ENV.jwtSecret);
    const token = await new jose.SignJWT({
      openId: `discord_${discordUser.id}`,
      discordId: discordUser.id,
      username: discordUser.username,
      email: discordUser.email,
      guilds: guilds.map((g) => ({ id: g.id, name: g.name })),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    // Redirect to dashboard
    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Discord OAuth error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
