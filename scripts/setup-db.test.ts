import { describe, expect, it } from "vitest";
import {
  escapeGrantDatabase,
  parseDatabaseUrl,
  resolveAccountHosts,
  setupDatabase,
} from "./setup-db";

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

  it("rejects a URL without a password", () => {
    expect(() =>
      parseDatabaseUrl("mysql://bot_user@localhost:3306/discord_bot_builder")
    ).toThrow(/password/);
  });

  it("does not leak credentials when the URL is invalid", () => {
    const secret = "mysql://bot_user:hunter2@localhost:notaport/db";
    let message = "";
    try {
      parseDatabaseUrl(secret);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toContain("hunter2");
    expect(message).not.toContain(secret);
  });
});

describe("resolveAccountHosts", () => {
  it("provisions the loopback forms for local servers", () => {
    expect(resolveAccountHosts("localhost")).toEqual([
      "localhost",
      "127.0.0.1",
      "::1",
    ]);
    expect(resolveAccountHosts("127.0.0.1")).toEqual([
      "localhost",
      "127.0.0.1",
      "::1",
    ]);
  });

  it("treats IPv6 loopback as local instead of any host", () => {
    expect(resolveAccountHosts("[::1]")).toEqual([
      "localhost",
      "127.0.0.1",
      "::1",
    ]);
    expect(resolveAccountHosts("::1")).toEqual([
      "localhost",
      "127.0.0.1",
      "::1",
    ]);
  });

  it("falls back to any host for remote servers", () => {
    expect(resolveAccountHosts("db.example")).toEqual(["%"]);
  });

  it("honours an explicit override", () => {
    expect(resolveAccountHosts("db.example", "10.0.0.5")).toEqual(["10.0.0.5"]);
  });
});

describe("escapeGrantDatabase", () => {
  it("escapes wildcards so grants do not match other databases", () => {
    expect(escapeGrantDatabase("discord_bot_builder")).toBe(
      "`discord\\_bot\\_builder`"
    );
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
