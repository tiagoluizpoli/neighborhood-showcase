import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  type GetProviderProfileInput,
  ProviderProfileNotFoundError,
} from '../../application/use-cases/provider-profile/get-provider-profile';
import type { UpdateProviderProfileInput } from '../../application/use-cases/provider-profile/update-provider-profile';
import {
  createProviderProfileRouterDependencies,
  type ProviderProfileRouterDependencies,
} from '../../main/di/provider-profile-router';
import { protectedProcedure, router } from '../trpc';

export function createProviderProfileRouter(
  dependencies: ProviderProfileRouterDependencies,
) {
  const { getProviderProfileUseCase, updateProviderProfileUseCase } =
    dependencies;

  return router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const input: GetProviderProfileInput = {
        providerId: ctx.session.user.id,
      };
      try {
        const profile = await getProviderProfileUseCase.execute(input);
        return {
          id: profile.id,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          companyName: profile.companyName,
          tradeName: profile.tradeName,
          logoUrl: profile.logoUrl,
          bannerUrl: profile.bannerUrl,
          publicDescription: profile.publicDescription,
          socialLinks: profile.socialLinks,
          isProviderVisible: profile.isProviderVisible,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        };
      } catch (err) {
        if (err instanceof ProviderProfileNotFoundError) {
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
          displayName: z
            .string()
            .min(3, 'O nome de exibição deve ter pelo menos 3 caracteres')
            .max(100, 'O nome de exibição deve ter no máximo 100 caracteres')
            .optional(),
          avatarUrl: z.string().url().nullable().optional(),
          companyName: z.string().max(100).nullable().optional(),
          tradeName: z.string().max(100).nullable().optional(),
          logoUrl: z.string().url().nullable().optional(),
          bannerUrl: z.string().url().nullable().optional(),
          publicDescription: z
            .string()
            .max(500, 'A descrição pública não pode exceder 500 caracteres')
            .nullable()
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
        const updateInput: UpdateProviderProfileInput = {
          providerId: ctx.session.user.id,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          companyName: input.companyName,
          tradeName: input.tradeName,
          logoUrl: input.logoUrl,
          bannerUrl: input.bannerUrl,
          publicDescription: input.publicDescription,
          socialLinks: input.socialLinks,
          isProviderVisible: input.isProviderVisible,
        };
        try {
          await updateProviderProfileUseCase.execute(updateInput);
          return { success: true };
        } catch (err) {
          if (err instanceof Error) {
            if (
              err.constructor.name === 'InvalidProviderDisplayNameError' ||
              err.constructor.name === 'InvalidProviderPublicDescriptionError'
            ) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: err.message,
              });
            }
          }
          throw err;
        }
      }),
  });
}

export const providerProfileRouter = createProviderProfileRouter(
  createProviderProfileRouterDependencies(),
);
