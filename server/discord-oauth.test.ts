import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

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
