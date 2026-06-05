import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CpfAlreadyBlacklistedError } from '../../application/use-cases/admin/add-blacklist';
import { CondominiumNotFoundError } from '../../application/use-cases/user/assign-moderator';
import { ProviderNotFoundError } from '../../application/use-cases/user/ban-provider';
import { UserNotFoundError } from '../../application/use-cases/user/promote-to-system-manager';
import { createAdminRouterDependencies } from '../../main/di';
import { protectedProcedure, router } from '../trpc';

const userRoleSchema = z.enum(['USER', 'SYSTEM_MANAGER', 'ADMINISTRATOR']);
const userStatusSchema = z.enum(['ACTIVE', 'BANNED']);

function checkGlobalAdmin(role: string | null | undefined) {
  return role === 'SYSTEM_MANAGER' || role === 'ADMINISTRATOR';
}

export function createAdminRouter(
  dependencies = createAdminRouterDependencies(),
) {
  const {
    listProvidersUseCase,
    listUsersUseCase,
    promoteToSystemManagerUseCase,
    assignModeratorUseCase,
    toggleProviderVisibilityUseCase,
    banProviderUseCase,
    listBlacklistUseCase,
    addBlacklistUseCase,
    removeBlacklistUseCase,
  } = dependencies;

  return router({
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
        if (!checkGlobalAdmin(ctx.session.user.role)) {
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
        if (!checkGlobalAdmin(ctx.session.user.role)) {
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
        if (!checkGlobalAdmin(ctx.session.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
        }

        try {
          await banProviderUseCase.execute({
            actorId: ctx.session.user.id,
            targetUserId: input.id,
            reason: input.reason,
          });
          return { success: true };
        } catch (error) {
          if (error instanceof ProviderNotFoundError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
              cause: error,
            });
          }
          throw error;
        }
      }),

    listBlacklist: protectedProcedure.query(async ({ ctx }) => {
      if (!checkGlobalAdmin(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }
      const entries = await listBlacklistUseCase.execute();
      return entries.map((e) => e.toDTO());
    }),

    addBlacklist: protectedProcedure
      .input(
        z.object({
          cpfHash: z.string().min(1),
          reason: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkGlobalAdmin(ctx.session.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
        }

        try {
          await addBlacklistUseCase.execute({
            cpfHash: input.cpfHash,
            reason: input.reason,
          });
          return { success: true };
        } catch (error) {
          if (error instanceof CpfAlreadyBlacklistedError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
              cause: error,
            });
          }
          throw error;
        }
      }),

    removeBlacklist: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!checkGlobalAdmin(ctx.session.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
        }

        await removeBlacklistUseCase.execute({ id: input.id });
        return { success: true };
      }),

    promoteToSystemManager: protectedProcedure
      .input(z.object({ targetUserId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!checkGlobalAdmin(ctx.session.user.role)) {
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
        if (!checkGlobalAdmin(ctx.session.user.role)) {
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
        if (!checkGlobalAdmin(ctx.session.user.role)) {
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
}

export const adminRouter = createAdminRouter();
