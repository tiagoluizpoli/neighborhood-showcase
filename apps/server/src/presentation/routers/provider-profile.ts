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
import { assertProviderOwnership, protectedProcedure, router } from '../trpc';

const providerProfileIdentitySchema = z.object({
  providerId: z.string().min(1).optional(),
});

const updateProviderProfileSchema = providerProfileIdentitySchema.extend({
  displayName: z
    .string()
    .min(3, 'O nome de exibição deve ter pelo menos 3 caracteres')
    .max(100, 'O nome de exibição deve ter no máximo 100 caracteres')
    .optional(),
  companyName: z.string().max(100).nullable().optional(),
  tradeName: z.string().max(100).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  logoOriginalUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  bannerOriginalUrl: z.string().url().nullable().optional(),
  publicDescription: z
    .string()
    .max(500, 'A descrição pública não pode exceder 500 caracteres')
    .nullable()
    .optional(),
  primaryPhone: z.string().optional(),
  callEnabled: z.boolean().optional(),
  contactMetadata: z
    .object({
      email: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      facebook: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  isProviderVisible: z.boolean().optional(),
});

export function createProviderProfileRouter(
  dependencies: ProviderProfileRouterDependencies,
) {
  const {
    getProviderProfileUseCase,
    updateProviderProfileUseCase,
    listOwnedProvidersUseCase,
    createProviderUseCase,
  } = dependencies;

  return router({
    // Mints a new provider owned by the caller plus a hidden default profile.
    // Backs the repeatable condo-setup create flow (T-20-05/ST-04): the same
    // path serves the first and the Nth provider, returning the new providerId
    // so the client can land in its `$providerId` context.
    create: protectedProcedure
      .input(
        z.object({
          displayName: z.string().trim().min(3).max(100),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return createProviderUseCase.execute({
          ownerId: ctx.session.user.id,
          displayName: input.displayName,
        });
      }),

    // Owner-scoped list backing the "My Providers" panel page. Keyed on the
    // caller's session id; soft-deleted providers are excluded by the repository.
    // No per-provider ownership guard is needed — the list only ever returns the
    // caller's own providers.
    listMine: protectedProcedure.query(async ({ ctx }) => {
      return listOwnedProvidersUseCase.execute({
        ownerId: ctx.session.user.id,
      });
    }),

    get: protectedProcedure
      .input(providerProfileIdentitySchema.optional())
      .query(async ({ ctx, input }) => {
        let providerId = input?.providerId;
        if (!providerId) {
          const owned = await listOwnedProvidersUseCase.execute({
            ownerId: ctx.session.user.id,
          });
          if (owned.length > 0) {
            providerId = owned[0]!.id;
          } else {
            providerId = ctx.session.user.id;
          }
        }
        // Provider-scoped read: ownership only (no APPROVED standing required to
        // view your own provider profile).
        await assertProviderOwnership({
          providerId,
          userId: ctx.session.user.id,
        });
        const providerInput: GetProviderProfileInput = {
          providerId,
        };

        try {
          const profile =
            await getProviderProfileUseCase.execute(providerInput);
          const { primaryPhone, callEnabled } = profile.contactDefaults;

          return {
            id: profile.id,
            providerId: profile.id,
            displayName: profile.displayName,
            companyName: profile.companyName,
            tradeName: profile.tradeName,
            logoUrl: profile.logoUrl,
            logoOriginalUrl: profile.logoOriginalUrl,
            bannerUrl: profile.bannerUrl,
            bannerOriginalUrl: profile.bannerOriginalUrl,
            publicDescription: profile.publicDescription,
            contactDefaults: profile.contactDefaults,
            contactMetadata: profile.contactMetadata,
            // Transitional flat view derived from the canonical contract; removed
            // when public surfaces migrate in T-17-04.
            socialLinks: {
              whatsapp: primaryPhone || undefined,
              phone: callEnabled && primaryPhone ? primaryPhone : undefined,
              ...profile.contactMetadata,
            },
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
      .input(updateProviderProfileSchema)
      .mutation(async ({ ctx, input }) => {
        let providerId = input.providerId;
        if (!providerId) {
          const owned = await listOwnedProvidersUseCase.execute({
            ownerId: ctx.session.user.id,
          });
          if (owned.length > 0) {
            providerId = owned[0]!.id;
          } else {
            providerId = ctx.session.user.id;
          }
        }
        // Provider-scoped mutation: ownership only (managing your provider's
        // profile does not require APPROVED residency standing).
        await assertProviderOwnership({
          providerId,
          userId: ctx.session.user.id,
        });
        const updateInput: UpdateProviderProfileInput = {
          providerId,
          displayName: input.displayName,
          companyName: input.companyName,

          tradeName: input.tradeName,
          logoUrl: input.logoUrl,
          logoOriginalUrl: input.logoOriginalUrl,
          bannerUrl: input.bannerUrl,
          bannerOriginalUrl: input.bannerOriginalUrl,
          publicDescription: input.publicDescription,
          primaryPhone: input.primaryPhone,
          callEnabled: input.callEnabled,
          contactMetadata: input.contactMetadata,
          isProviderVisible: input.isProviderVisible,
        };
        try {
          await updateProviderProfileUseCase.execute(updateInput);
          return { success: true };
        } catch (err) {
          if (err instanceof Error) {
            if (
              err.constructor.name === 'InvalidProviderDisplayNameError' ||
              err.constructor.name ===
                'InvalidProviderPublicDescriptionError' ||
              err.constructor.name === 'InvalidPrimaryPhoneError' ||
              err.constructor.name === 'ProviderCallRequiresPhoneError'
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
