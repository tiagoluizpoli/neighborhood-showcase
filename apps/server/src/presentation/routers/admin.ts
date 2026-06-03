import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import {
  account as accountSchema,
  blacklistedIdentifier as blacklistSchema,
  session as sessionSchema,
  user as userSchema,
} from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const adminRouter = router({
  listProviders: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        condominiumId: z.string().optional(),
        city: z.string().optional(),
        neighborhood: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      // Resolve qualifying user IDs: users with at least one providerLocation,
      // filtered by geographic scope when provided.
      const geoConditions: SQL[] = [];

      if (input.condominiumId) {
        geoConditions.push(
          eq(providerLocationSchema.condominiumId, input.condominiumId),
        );
      }

      if (input.city) {
        geoConditions.push(
          or(
            ilike(condominiumSchema.city, `%${input.city}%`),
            ilike(addressSchema.city, `%${input.city}%`),
          ) as SQL,
        );
      }

      if (input.neighborhood) {
        geoConditions.push(
          ilike(addressSchema.neighborhood, `%${input.neighborhood}%`),
        );
      }

      const qualifiedLocations = await db
        .selectDistinct({ userId: providerLocationSchema.providerId })
        .from(providerLocationSchema)
        .leftJoin(
          addressSchema,
          eq(providerLocationSchema.addressId, addressSchema.id),
        )
        .leftJoin(
          condominiumSchema,
          eq(providerLocationSchema.condominiumId, condominiumSchema.id),
        )
        .where(geoConditions.length > 0 ? and(...geoConditions) : undefined);

      const qualifiedUserIds = qualifiedLocations.map((l) => l.userId);

      if (qualifiedUserIds.length === 0) {
        return [];
      }

      const userConditions: SQL[] = [
        inArray(userSchema.id, qualifiedUserIds),
        eq(userSchema.isProviderVisible, true),
      ];

      if (input.search) {
        const pattern = `%${input.search}%`;
        userConditions.push(
          or(
            ilike(userSchema.name, pattern),
            ilike(userSchema.email, pattern),
          ) as SQL,
        );
      }

      return db
        .select()
        .from(userSchema)
        .where(and(...userConditions));
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
