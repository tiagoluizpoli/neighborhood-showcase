import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CpfAlreadyBlacklistedError } from '../../application/use-cases/admin/add-blacklist';
import { CondominiumNotFoundError } from '../../application/use-cases/user/assign-moderator';
import { ProviderNotFoundError } from '../../application/use-cases/user/ban-provider';
import { UserNotFoundError } from '../../application/use-cases/user/promote-to-system-manager';
import { createAdminRouterDependencies } from '../../main/di';
import { adminProcedure, router } from '../trpc';

// Every action in this router is a PLATFORM-ADMIN action: it operates on global
// state (user roles, provider visibility/bans, the CPF blacklist) and is gated
// solely by the global `user.role` (SYSTEM_MANAGER | ADMINISTRATOR) through
// `adminProcedure`. None of these are provider-scoped, so no ownership/standing
// guard applies. The role gate now lives in the procedure layer (T-20-04/ST-02)
// instead of per-handler `checkGlobalAdmin` branches.

const userRoleSchema = z.enum(['USER', 'SYSTEM_MANAGER', 'ADMINISTRATOR']);
const userStatusSchema = z.enum(['ACTIVE', 'BANNED']);

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
    listProviders: adminProcedure
      .input(
        z.object({
          search: z.string().optional(),
          condominiumId: z.string().optional(),
          city: z.string().optional(),
          neighborhood: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        const providers = await listProvidersUseCase.execute({
          search: input.search,
          condominiumId: input.condominiumId,
          city: input.city,
          neighborhood: input.neighborhood,
        });

        return providers.map((p) => p.toDTO());
      }),

    listUsers: adminProcedure
      .input(
        z.object({
          search: z.string().optional(),
          role: userRoleSchema.optional(),
          status: userStatusSchema.optional(),
        }),
      )
      .query(async ({ input }) => {
        const users = await listUsersUseCase.execute({
          search: input.search,
          role: input.role,
          status: input.status,
        });

        return users.map((u) => u.toDTO());
      }),

    banProvider: adminProcedure
      .input(
        z.object({
          id: z.string().min(1),
          reason: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
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

    listBlacklist: adminProcedure.query(async () => {
      const entries = await listBlacklistUseCase.execute();
      return entries.map((e) => e.toDTO());
    }),

    addBlacklist: adminProcedure
      .input(
        z.object({
          cpfHash: z.string().min(1),
          reason: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
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

    removeBlacklist: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await removeBlacklistUseCase.execute({ id: input.id });
        return { success: true };
      }),

    promoteToSystemManager: adminProcedure
      .input(z.object({ targetUserId: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
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

    assignModerator: adminProcedure
      .input(
        z.object({
          targetUserId: z.string().min(1),
          condominiumId: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
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

    toggleProviderVisibility: adminProcedure
      .input(z.object({ targetUserId: z.string().min(1) }))
      .mutation(async ({ input }) => {
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
