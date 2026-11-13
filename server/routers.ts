import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { maskToken } from "./token-mask";

/**
 * Replace the bot token with a non-reversible preview before it leaves the
 * server. The full token is only ever returned by the explicit export endpoint.
 */
function maskedProject<T extends object>(
  project: T & { discordToken?: string | null }
) {
  return { ...project, discordToken: maskToken(project.discordToken) };
}

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
    list: protectedProcedure.query(async ({ ctx }) =>
      (await db.getBotProjectsByUserId(ctx.user.id)).map(maskedProject)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getBotProjectById(input.id, ctx.user.id);
        // Scoped by userId in the query; return nothing for another user's id
        // so the caller cannot distinguish "not found" from "not yours".
        return project ? maskedProject(project) : undefined;
      }),
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
    /**
     * Return the generated-bot payload, including the decrypted token, for the
     * editor's export action. Ownership is enforced by passing the caller's id
     * to the scoped query, so another user's project is never returned.
     */
    export: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getBotProjectById(input.id, ctx.user.id);
        if (!project) return undefined;
        return { id: project.id, name: project.name, discordToken: project.discordToken };
      }),
  }),
});

export type AppRouter = typeof appRouter;
