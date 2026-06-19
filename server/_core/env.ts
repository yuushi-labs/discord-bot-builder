export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  discordClientId: process.env.DISCORD_CLIENT_ID ?? (process.env.NODE_ENV === "test" ? "123456789012345678" : ""),
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET ?? (process.env.NODE_ENV === "test" ? "test_secret" : ""),
  jwtSecret: process.env.JWT_SECRET ?? (process.env.NODE_ENV === "test" ? "test_jwt_secret" : ""),
};
