import { protectedProcedure, router } from '../trpc';
import { db } from '@base-fullstack-template/db';
import {
  user as userSchema,
  session as sessionSchema,
  account as accountSchema,
  blacklistedIdentifier as blacklistSchema,
} from '@base-fullstack-template/db/schema/auth';
import { announcement as announcementSchema } from '@base-fullstack-template/db/schema/showcase';
import { and, eq, ilike, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import crypto from 'node:crypto';

export const adminRouter = router({
  listProviders: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      if (input.search) {
        const searchPattern = `%${input.search}%`;
        return db
          .select()
          .from(userSchema)
          .where(
            and(
              eq(userSchema.role, 'PROVIDER'),
              or(
                ilike(userSchema.name, searchPattern),
                ilike(userSchema.email, searchPattern),
              ),
            ),
          );
      }

      return db
        .select()
        .from(userSchema)
        .where(eq(userSchema.role, 'PROVIDER'));
    }),

  banProvider: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      const [targetUser] = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, input.id))
        .limit(1);

      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
        });
      }

      // 1. Update user status to BANNED
      await db
        .update(userSchema)
        .set({ status: 'BANNED' })
        .where(eq(userSchema.id, input.id));

      // 2. Add CPF hash to blacklist if available
      if (targetUser.cpfHash) {
        const [existing] = await db
          .select()
          .from(blacklistSchema)
          .where(eq(blacklistSchema.cpfHash, targetUser.cpfHash))
          .limit(1);

        if (!existing) {
          await db.insert(blacklistSchema).values({
            id: crypto.randomUUID(),
            cpfHash: targetUser.cpfHash,
            reason: input.reason,
          });
        }
      }

      // 3. Remove/hide all their announcements (soft delete them)
      await db
        .update(announcementSchema)
        .set({
          deletedAt: new Date(),
          status: 'SUSPENDED',
          suspensionReason: `Banido globalmente: ${input.reason}`,
        })
        .where(eq(announcementSchema.providerId, input.id));

      // 4. Revoke all sessions and accounts to log them out
      await db.delete(sessionSchema).where(eq(sessionSchema.userId, input.id));
      await db.delete(accountSchema).where(eq(accountSchema.userId, input.id));

      return { success: true };
    }),

  listBlacklist: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
    }
    return db.select().from(blacklistSchema);
  }),

  addBlacklist: protectedProcedure
    .input(
      z.object({
        cpfHash: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      const [existing] = await db
        .select()
        .from(blacklistSchema)
        .where(eq(blacklistSchema.cpfHash, input.cpfHash))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este CPF já está na lista negra.',
        });
      }

      await db.insert(blacklistSchema).values({
        id: crypto.randomUUID(),
        cpfHash: input.cpfHash,
        reason: input.reason,
      });

      return { success: true };
    }),

  removeBlacklist: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      await db.delete(blacklistSchema).where(eq(blacklistSchema.id, input.id));
      return { success: true };
    }),
});
