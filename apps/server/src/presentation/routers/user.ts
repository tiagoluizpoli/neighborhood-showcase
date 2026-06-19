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
    getUserAccessProfileUseCase,
    getUserProfileUseCase,
    updateUserUseCase,
  } = dependencies;

  return router({
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteUserAccountUseCase.execute({ userId: ctx.session.user.id });
      return { success: true };
    }),
    getAccessProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getUserAccessProfileUseCase.execute({
        userId: ctx.session.user.id,
      });
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
          image: z.string().url().optional(),
          language: z.enum(['pt-BR', 'en']).optional(),
          theme: z.enum(['system', 'light', 'dark']).optional(),
          phone: z
            .string()
            .min(8, 'O telefone deve ter pelo menos 8 caracteres')
            .max(20, 'O telefone deve ter no máximo 20 caracteres')
            .optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await updateUserUseCase.execute({
          userId: ctx.session.user.id,
          name: input.name,
          image: input.image,
          language: input.language,
          theme: input.theme,
          phone: input.phone,
        });
      }),
  });
}

export const userRouter = createUserRouter();
