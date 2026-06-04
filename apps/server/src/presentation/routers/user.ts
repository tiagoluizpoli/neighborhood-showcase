import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { PublicProviderNotFoundError } from '../../application/use-cases/user/get-public-provider-profile';
import { createUserRouterDependencies } from '../../main/di';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export function createUserRouter(
  dependencies = createUserRouterDependencies(),
) {
  const {
    deleteUserAccountUseCase,
    getPublicProviderProfileUseCase,
    getUserProfileUseCase,
    updateUserUseCase,
  } = dependencies;

  return router({
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteUserAccountUseCase.execute({ userId: ctx.session.user.id });
      return { success: true };
    }),
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getUserProfileUseCase.execute({
          userId: ctx.session.user.id,
        });
      } catch {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }
    }),
    getPublicProfile: publicProcedure
      .input(
        z.object({
          id: z.string().min(1),
        }),
      )
      .query(async ({ input }) => {
        try {
          return await getPublicProviderProfileUseCase.execute({
            providerId: input.id,
          });
        } catch (err) {
          if (err instanceof PublicProviderNotFoundError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: err.message,
            });
          }
          throw err;
        }
      }),
    update: protectedProcedure
      .input(
        z.object({
          name: z
            .string()
            .min(3, 'O nome deve ter pelo menos 3 caracteres')
            .max(100, 'O nome deve ter no máximo 100 caracteres')
            .optional(),
          socialLinks: z
            .object({
              whatsapp: z.string().optional(),
              phone: z.string().optional(),
              email: z.string().optional(),
              instagram: z.string().optional(),
              tiktok: z.string().optional(),
              facebook: z.string().optional(),
              website: z.string().optional(),
            })
            .optional(),
          isProviderVisible: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await updateUserUseCase.execute({
          userId: ctx.session.user.id,
          name: input.name,
          socialLinks: input.socialLinks,
          isProviderVisible: input.isProviderVisible,
        });
      }),
  });
}

export const userRouter = createUserRouter();
