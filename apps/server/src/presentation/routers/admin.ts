import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import {
  account as accountSchema,
  blacklistedIdentifier as blacklistSchema,
  session as sessionSchema,
  user as userSchema,
} from '@neighborhood-showcase/db/schema/auth';
import { announcement as announcementSchema } from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  AssignModerator,
  CondominiumNotFoundError,
} from '../../application/use-cases/user/assign-moderator';
import { ListProviders } from '../../application/use-cases/user/list-providers';
import { ListUsers } from '../../application/use-cases/user/list-users';
import {
  PromoteToSystemManager,
  UserNotFoundError,
} from '../../application/use-cases/user/promote-to-system-manager';
import { ToggleProviderVisibility } from '../../application/use-cases/user/toggle-provider-visibility';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleCondominiumRepository } from '../../infrastructure/db/condominium-repository';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';
import { protectedProcedure, router } from '../trpc';

const userRoleSchema = z.enum(['PROVIDER', 'SYSTEM_MANAGER']);
const userStatusSchema = z.enum(['ACTIVE', 'BANNED']);

const userRepo = new DrizzleUserRepository();
const condoRepo = new DrizzleCondominiumRepository();
const assignmentRepo = new DrizzleAssignmentRepository();

const listProvidersUseCase = new ListProviders(userRepo);
const listUsersUseCase = new ListUsers(userRepo);
const promoteToSystemManagerUseCase = new PromoteToSystemManager(userRepo);
const assignModeratorUseCase = new AssignModerator(
  userRepo,
  condoRepo,
  assignmentRepo,
);
const toggleProviderVisibilityUseCase = new ToggleProviderVisibility(userRepo);

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

      const users = await listUsersUseCase.execute({
        search: input.search,
        role: input.role,
        status: input.status,
      });

      return users.map((u) => u.toDTO());
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

      try {
        await promoteToSystemManagerUseCase.execute({
          actorId: ctx.session.user.id,
          targetUserId: input.targetUserId,
        });
        return { success: true };
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
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

      try {
        await assignModeratorUseCase.execute({
          actorId: ctx.session.user.id,
          targetUserId: input.targetUserId,
          condominiumId: input.condominiumId,
        });
        return { success: true };
      } catch (error) {
        if (
          error instanceof UserNotFoundError ||
          error instanceof CondominiumNotFoundError
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  toggleProviderVisibility: protectedProcedure
    .input(z.object({ targetUserId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      try {
        return await toggleProviderVisibilityUseCase.execute({
          targetUserId: input.targetUserId,
        });
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),
});
