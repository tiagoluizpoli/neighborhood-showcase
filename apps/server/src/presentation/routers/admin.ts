import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  AddBlacklist,
  CpfAlreadyBlacklistedError,
} from '../../application/use-cases/admin/add-blacklist';
import { ListBlacklist } from '../../application/use-cases/admin/list-blacklist';
import { RemoveBlacklist } from '../../application/use-cases/admin/remove-blacklist';
import {
  AssignModerator,
  CondominiumNotFoundError,
} from '../../application/use-cases/user/assign-moderator';
import {
  BanProvider,
  ProviderNotFoundError,
} from '../../application/use-cases/user/ban-provider';
import { ListProviders } from '../../application/use-cases/user/list-providers';
import { ListUsers } from '../../application/use-cases/user/list-users';
import {
  PromoteToSystemManager,
  UserNotFoundError,
} from '../../application/use-cases/user/promote-to-system-manager';
import { ToggleProviderVisibility } from '../../application/use-cases/user/toggle-provider-visibility';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleBlacklistRepository } from '../../infrastructure/db/blacklist-repository';
import { DrizzleCondominiumRepository } from '../../infrastructure/db/condominium-repository';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';
import { protectedProcedure, router } from '../trpc';

const userRoleSchema = z.enum(['PROVIDER', 'SYSTEM_MANAGER']);
const userStatusSchema = z.enum(['ACTIVE', 'BANNED']);

const userRepo = new DrizzleUserRepository();
const condoRepo = new DrizzleCondominiumRepository();
const assignmentRepo = new DrizzleAssignmentRepository();
const blacklistRepo = new DrizzleBlacklistRepository();
const announcementRepo = new DrizzleAnnouncementRepository();

const listProvidersUseCase = new ListProviders(userRepo);
const listUsersUseCase = new ListUsers(userRepo);
const promoteToSystemManagerUseCase = new PromoteToSystemManager(userRepo);
const assignModeratorUseCase = new AssignModerator(
  userRepo,
  condoRepo,
  assignmentRepo,
);
const toggleProviderVisibilityUseCase = new ToggleProviderVisibility(userRepo);
const banProviderUseCase = new BanProvider(
  userRepo,
  blacklistRepo,
  announcementRepo,
);
const listBlacklistUseCase = new ListBlacklist(blacklistRepo);
const addBlacklistUseCase = new AddBlacklist(blacklistRepo);
const removeBlacklistUseCase = new RemoveBlacklist(blacklistRepo);

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
    if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
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
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
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
      if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      }

      await removeBlacklistUseCase.execute({ id: input.id });
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
