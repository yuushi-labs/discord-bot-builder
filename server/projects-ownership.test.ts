import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getBotProjectsByUserId: vi.fn(),
  getBotProjectById: vi.fn(),
  createBotProject: vi.fn(),
  updateBotProject: vi.fn(),
  deleteBotProject: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function ctxFor(userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `discord_${userId}`,
    email: `${userId}@example.invalid`,
    name: `User ${userId}`,
    loginMethod: "discord",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("projects ownership (IDOR)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes the caller's id to every scoped query", async () => {
    vi.mocked(db.getBotProjectsByUserId).mockResolvedValue([]);
    vi.mocked(db.getBotProjectById).mockResolvedValue(undefined);
    vi.mocked(db.updateBotProject).mockResolvedValue([] as never);
    vi.mocked(db.deleteBotProject).mockResolvedValue([] as never);

    const caller = appRouter.createCaller(ctxFor(7));
    await caller.projects.list();
    await caller.projects.get({ id: 99 });
    await caller.projects.export({ id: 99 });
    await caller.projects.update({ id: 99, name: "x" });
    await caller.projects.delete({ id: 99 });

    expect(db.getBotProjectsByUserId).toHaveBeenCalledWith(7);
    expect(db.getBotProjectById).toHaveBeenNthCalledWith(1, 99, 7);
    expect(db.getBotProjectById).toHaveBeenNthCalledWith(2, 99, 7);
    expect(db.updateBotProject).toHaveBeenCalledWith(99, 7, expect.anything());
    expect(db.deleteBotProject).toHaveBeenCalledWith(99, 7);
  });

  it("masks the token in list and get responses", async () => {
    const stored = "MTIzNDU2Nzg5MDEyMzQ1Njc4.ABCDEF.ghijklmnopqrstuvwxyz";
    vi.mocked(db.getBotProjectsByUserId).mockResolvedValue([
      {
        id: 1,
        userId: 7,
        name: "My Bot",
        blocklyWorkspace: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    vi.mocked(db.getBotProjectById).mockResolvedValue({
      id: 1,
      userId: 7,
      name: "My Bot",
      discordToken: stored,
      blocklyWorkspace: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const caller = appRouter.createCaller(ctxFor(7));
    const list = await caller.projects.list();
    const get = await caller.projects.get({ id: 1 });

    // The list query never selects the token, so it stays empty there.
    expect(list[0]?.discordToken).toBe("");
    expect(list[0]?.discordToken).not.toBe(stored);
    // The detail view masks it to a preview.
    expect(get?.discordToken).not.toBe(stored);
    expect(get?.discordToken).toContain("************");
    expect(JSON.stringify(get)).not.toContain(stored);
  });

  it("returns nothing for a project that is not the caller's", async () => {
    // The db layer is scoped by userId, so a foreign id yields undefined.
    vi.mocked(db.getBotProjectById).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(ctxFor(7));
    expect(await caller.projects.get({ id: 1234 })).toBeUndefined();
    expect(await caller.projects.export({ id: 1234 })).toBeUndefined();
  });

  it("only reveals the raw token through the explicit export endpoint", async () => {
    const stored = "MTIzNDU2Nzg5MDEyMzQ1Njc4.ABCDEF.ghijklmnopqrstuvwxyz";
    vi.mocked(db.getBotProjectById).mockResolvedValue({
      id: 1,
      userId: 7,
      name: "My Bot",
      discordToken: stored,
      blocklyWorkspace: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const caller = appRouter.createCaller(ctxFor(7));
    const exported = await caller.projects.export({ id: 1 });
    expect(exported).toEqual({ id: 1, name: "My Bot", discordToken: stored });
    expect(db.getBotProjectById).toHaveBeenCalledWith(1, 7);
  });

  it("rejects unauthenticated access to projects", async () => {
    const anon: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(anon);
    await expect(caller.projects.list()).rejects.toThrow(/login/i);
    await expect(caller.projects.export({ id: 1 })).rejects.toThrow(/login/i);
  });
});
