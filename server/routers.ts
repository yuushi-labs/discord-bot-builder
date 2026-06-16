import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getBotProjectsByUserId(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getBotProjectById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        discordToken: z.string().min(1),
      }))
      .mutation(({ ctx, input }) =>
        db.createBotProject(ctx.user.id, input.name, input.discordToken)
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        blocklyWorkspace: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.updateBotProject(input.id, ctx.user.id, {
          name: input.name,
          blocklyWorkspace: input.blocklyWorkspace,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteBotProject(input.id, ctx.user.id)
      ),
  }),
});

export type AppRouter = typeof appRouter;
