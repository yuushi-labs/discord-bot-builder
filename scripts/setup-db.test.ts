import { describe, expect, it } from "vitest";
import { parseDatabaseUrl, setupDatabase } from "./setup-db";

describe("parseDatabaseUrl", () => {
  it("extracts the connection parts, decoding credentials", () => {
    expect(
      parseDatabaseUrl(
        "mysql://bot_user:p%40ss@db.example:3307/discord_bot_builder"
      )
    ).toEqual({
      host: "db.example",
      port: "3307",
      user: "bot_user",
      password: "p@ss",
      database: "discord_bot_builder",
    });
  });

  it("defaults the port", () => {
    const parsed = parseDatabaseUrl(
      "mysql://bot_user:pw@localhost/discord_bot_builder"
    );
    expect(parsed.host).toBe("localhost");
    expect(parsed.port).toBe("3306");
  });

  it("rejects a URL without a database name", () => {
    expect(() =>
      parseDatabaseUrl("mysql://bot_user:pw@localhost:3306")
    ).toThrow(/database name/);
  });

  it("rejects a URL without a user name", () => {
    expect(() =>
      parseDatabaseUrl("mysql://localhost:3306/discord_bot_builder")
    ).toThrow(/user name/);
  });
});

describe("setupDatabase input validation", () => {
  it("refuses unsafe database names before connecting", async () => {
    await expect(
      setupDatabase(
        "mysql://root@localhost:3306",
        "mysql://bot_user:pw@localhost:3306/bad-name;drop"
      )
    ).rejects.toThrow(/Unsafe database name/);
  });
});
