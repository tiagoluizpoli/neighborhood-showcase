import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import {
  account as accountSchema,
  blacklistedIdentifier as blacklistSchema,
  session as sessionSchema,
  user as userSchema,
} from '@neighborhood-showcase/db/schema/auth';
import {
  announcement as announcementSchema,
  assignment as assignmentSchema,
  condominium as condominiumSchema,
  roleChangeLog as roleChangeLogSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, ilike, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { ListProviders } from '../../application/use-cases/user/list-providers';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';
import { protectedProcedure, router } from '../trpc';

const userRoleSchema = z.enum(['PROVIDER', 'SYSTEM_MANAGER']);
const userStatusSchema = z.enum(['ACTIVE', 'BANNED']);

const userRepo = new DrizzleUserRepository();
const listProvidersUseCase = new ListProviders(userRepo);

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

      const providers = await listProvidersUseCase.execute({
        search: input.search,
        condominiumId: input.condominiumId,
        city: input.city,
        neighborhood: input.neighborhood,
      });

      return providers.map((p) => p.toDTO());
    }),

  listUsers: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: userRoleSchema.optional(),
        status: userStatusSchema.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      const conditions: SQL[] = [];

      if (input.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(
            ilike(userSchema.name, pattern),
            ilike(userSchema.email, pattern),
          ) as SQL,
        );
      }

      if (input.role) {
        conditions.push(eq(userSchema.role, input.role));
      }

      if (input.status) {
        conditions.push(eq(userSchema.status, input.status));
      }

      return db
        .select()
        .from(userSchema)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
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

  promoteToSystemManager: protectedProcedure
    .input(z.object({ targetUserId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      const [target] = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, input.targetUserId))
        .limit(1);

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
        });
      }

      const previousRole = target.role;

      await db
        .update(userSchema)
        .set({ role: 'SYSTEM_MANAGER' })
        .where(eq(userSchema.id, input.targetUserId));

      await db.insert(roleChangeLogSchema).values({
        id: crypto.randomUUID(),
        actorId: ctx.session.user.id,
        targetUserId: input.targetUserId,
        previousRole,
        newRole: 'SYSTEM_MANAGER',
      });

      return { success: true };
    }),

  assignModerator: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
        condominiumId: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      const [target] = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, input.targetUserId))
        .limit(1);

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
        });
      }

      const [condo] = await db
        .select({ id: condominiumSchema.id })
        .from(condominiumSchema)
        .where(eq(condominiumSchema.id, input.condominiumId))
        .limit(1);

      if (!condo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Condomínio não encontrado.',
        });
      }

      // Upsert: insert MODERATOR assignment (approved) if none exists for this pair.
      const [existing] = await db
        .select({ id: assignmentSchema.id })
        .from(assignmentSchema)
        .where(
          and(
            eq(assignmentSchema.providerId, input.targetUserId),
            eq(assignmentSchema.condominiumId, input.condominiumId),
            eq(assignmentSchema.type, 'MODERATOR'),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(assignmentSchema).values({
          id: crypto.randomUUID(),
          providerId: input.targetUserId,
          condominiumId: input.condominiumId,
          type: 'MODERATOR',
          status: 'APPROVED',
          unitInfo: '',
        });
      } else {
        await db
          .update(assignmentSchema)
          .set({ status: 'APPROVED' })
          .where(eq(assignmentSchema.id, existing.id));
      }

      await db.insert(roleChangeLogSchema).values({
        id: crypto.randomUUID(),
        actorId: ctx.session.user.id,
        targetUserId: input.targetUserId,
        previousRole: target.role,
        newRole: 'MODERATOR',
        condominiumId: input.condominiumId,
      });

      return { success: true };
    }),

  toggleProviderVisibility: protectedProcedure
    .input(z.object({ targetUserId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      const [target] = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, input.targetUserId))
        .limit(1);

      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado.',
        });
      }

      const newVisibility = !target.isProviderVisible;

      await db
        .update(userSchema)
        .set({ isProviderVisible: newVisibility })
        .where(eq(userSchema.id, input.targetUserId));

      return { isProviderVisible: newVisibility };
    }),
});
