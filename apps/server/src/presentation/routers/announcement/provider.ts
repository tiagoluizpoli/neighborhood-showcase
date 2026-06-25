import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  AnnouncementAccessDeniedError as AnalyticsAnnouncementAccessDeniedError,
  AnnouncementNotFoundError as AnalyticsAnnouncementNotFoundError,
} from '../../../application/use-cases/announcement/get-announcement-analytics';
import {
  AnnouncementUpdateAccessDeniedError,
  VerifiedBadgeEligibilityError,
} from '../../../application/use-cases/announcement/update-announcement';
import {
  AnnouncementAccessDeniedError,
  PaymentNotFoundError,
} from '../../../application/use-cases/payment/get-payment-status';
import {
  type AnnouncementContactSettings,
  normalizePhone,
} from '../../../domain/entities/contact';
import {
  type AnnouncementCta,
  type CtaTarget,
  EMPTY_CTA,
  InvalidCtaLabelError,
  InvalidCtaTargetError,
  TooManyCtaTargetsError,
} from '../../../domain/entities/cta';
import type { AnnouncementRouterDependencies } from '../../../main/di/announcement-router';
import { protectedProcedure } from '../../trpc';

const providerContactLinksSchema = z.object({
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
});

// Canonical structured contact input (T-17-02). The provider create form sends
// inherit/custom directly; inherit defers to live provider defaults, custom
// carries its own baseline.
const announcementContactInputSchema = z.object({
  mode: z.enum(['inherit', 'custom']),
  custom: z
    .object({
      primaryPhone: z.string(),
      callEnabled: z.boolean(),
    })
    .nullable(),
});

// Bounded CTA input (T-17-04). Targets are announcement-level only and limited
// to the locked v1 set; the domain layer enforces value validity and the
// secondary cap.
const ctaTargetInputSchema = z.object({
  type: z.enum([
    'provider_profile',
    'website',
    'instagram',
    'tiktok',
    'whatsapp',
  ]),
  value: z.string().nullable(),
  label: z.string().nullable().optional(),
});

const announcementCtaInputSchema = z.object({
  primary: ctaTargetInputSchema.nullable(),
  secondary: z.array(ctaTargetInputSchema),
});

function toCtaTarget(target: z.infer<typeof ctaTargetInputSchema>): CtaTarget {
  const label = target.label?.trim() || null;
  const raw = target.value?.trim() ?? '';
  if (raw.length === 0) {
    return { type: target.type, value: null, label };
  }
  const value = target.type === 'whatsapp' ? normalizePhone(raw) : raw;
  return { type: target.type, value, label };
}

function toCta(
  cta: z.infer<typeof announcementCtaInputSchema> | undefined,
): AnnouncementCta {
  if (!cta) {
    return EMPTY_CTA;
  }
  return {
    primary: cta.primary ? toCtaTarget(cta.primary) : null,
    secondary: cta.secondary.map(toCtaTarget),
  };
}

// Translate the bounded-CTA domain errors into transport errors. Returns other
// errors untouched so existing tRPC/domain handling keeps its behavior.
function toCtaAwareTRPCError(error: unknown): unknown {
  if (
    error instanceof InvalidCtaTargetError ||
    error instanceof InvalidCtaLabelError ||
    error instanceof TooManyCtaTargetsError
  ) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
      cause: error,
    });
  }
  return error;
}

function toContactSettings(
  contact: z.infer<typeof announcementContactInputSchema>,
): AnnouncementContactSettings {
  if (contact.mode === 'custom') {
    return {
      mode: 'custom',
      custom: {
        primaryPhone: normalizePhone(contact.custom?.primaryPhone ?? ''),
        callEnabled: Boolean(contact.custom?.callEnabled),
      },
    };
  }
  return { mode: 'inherit', custom: null };
}

// Transitional adapter: surfaces not yet migrated to structured contact (the
// legacy dashboard create form and the edit flow, T-17-03) still submit the flat
// contactLinks shape. Map it onto the canonical custom contract.
function flatLinksToContactSettings(links: {
  whatsapp?: string;
  phone?: string;
}): AnnouncementContactSettings {
  const primaryPhone = normalizePhone(links.whatsapp ?? links.phone ?? '');
  return {
    mode: 'custom',
    custom: {
      primaryPhone,
      callEnabled: Boolean(links.phone?.trim()),
    },
  };
}

export function createProviderAnnouncementRouter(
  dependencies: AnnouncementRouterDependencies,
) {
  const {
    createAnnouncementUseCase,
    generatePaymentIntentUseCase,
    getPaymentStatusUseCase,
    updateAnnouncementUseCase,
    getProviderDashboardDataUseCase,
    getAnnouncementAnalyticsUseCase,
  } = dependencies;

  return {
    create: protectedProcedure
      .input(
        z.object({
          // Optional active provider PK. Panel URLs key on $providerId in
          // T-20-05; until then single-provider callers fall back to the
          // session user id (which equals provider.id for those providers).
          providerId: z.string().min(1).optional(),
          providerAssignmentId: z.string().min(1),
          title: z.string().min(3).max(100),
          subtitle: z.string().nullable().optional(),
          description: z.string().min(10).max(2000),
          priceCents: z.number().nullable().optional(),
          imageUrl: z.string().min(1),
          categoryId: z.string().min(1),
          tags: z.array(z.string()),
          contact: announcementContactInputSchema.optional(),
          contactLinks: providerContactLinksSchema.optional(),
          cta: announcementCtaInputSchema.optional(),
          showVerifiedBadge: z.boolean(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const contact = input.contact
          ? toContactSettings(input.contact)
          : flatLinksToContactSettings(input.contactLinks ?? {});

        try {
          const ann = await createAnnouncementUseCase.execute({
            providerId: input.providerId ?? ctx.session.user.id,
            providerAssignmentId: input.providerAssignmentId,
            title: input.title,
            subtitle: input.subtitle,
            description: input.description,
            priceCents: input.priceCents,
            imageUrl: input.imageUrl,
            categoryId: input.categoryId,
            tags: input.tags,
            contact,
            cta: toCta(input.cta),
            showVerifiedBadge: input.showVerifiedBadge,
          });

          return ann.toDTO();
        } catch (error) {
          throw toCtaAwareTRPCError(error);
        }
      }),

    getPaymentDetails: protectedProcedure
      .input(
        z.object({
          announcementId: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return generatePaymentIntentUseCase.execute({
          announcementId: input.announcementId,
          providerId: ctx.session.user.id,
          customerName: ctx.session.user.name || 'Provedor',
          customerEmail: ctx.session.user.email,
        });
      }),

    getPaymentStatus: protectedProcedure
      .input(
        z.object({
          announcementId: z.string().min(1),
        }),
      )
      .query(async ({ input, ctx }) => {
        try {
          return await getPaymentStatusUseCase.execute({
            announcementId: input.announcementId,
            providerId: ctx.session.user.id,
          });
        } catch (error) {
          if (error instanceof PaymentNotFoundError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
              cause: error,
            });
          }

          if (error instanceof AnnouncementAccessDeniedError) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: error.message,
              cause: error,
            });
          }

          throw error;
        }
      }),

    getDashboardData: protectedProcedure
      .input(
        z
          .object({
            providerId: z.string().min(1).optional(),
          })
          .optional(),
      )
      .query(async ({ input, ctx }) => {
        return getProviderDashboardDataUseCase.execute({
          providerId: input?.providerId ?? ctx.session.user.id,
        });
      }),

    getAnalytics: protectedProcedure
      .input(
        z.object({
          announcementId: z.string().min(1).optional(),
          period: z.enum(['7d', '30d', '12m']),
        }),
      )
      .query(async ({ input, ctx }) => {
        try {
          return await getAnnouncementAnalyticsUseCase.execute({
            announcementId: input.announcementId,
            providerId: ctx.session.user.id,
            period: input.period,
          });
        } catch (error) {
          if (error instanceof AnalyticsAnnouncementNotFoundError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
              cause: error,
            });
          }

          if (error instanceof AnalyticsAnnouncementAccessDeniedError) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: error.message,
              cause: error,
            });
          }

          throw error;
        }
      }),

    update: protectedProcedure
      .input(
        z.object({
          // Optional active provider PK; see `create` above for the T-20-05
          // routing seam. Falls back to the session user id today.
          providerId: z.string().min(1).optional(),
          id: z.string().min(1),
          title: z.string().min(3).max(100),
          subtitle: z.string().nullable().optional(),
          description: z.string().min(10).max(2000),
          priceCents: z.number().nullable().optional(),
          imageUrl: z.string().min(1),
          categoryId: z.string().min(1),
          tags: z.array(z.string()),
          contact: announcementContactInputSchema.optional(),
          contactLinks: providerContactLinksSchema.optional(),
          cta: announcementCtaInputSchema.optional(),
          showVerifiedBadge: z.boolean(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const contact = input.contact
            ? toContactSettings(input.contact)
            : flatLinksToContactSettings({
                whatsapp: input.contactLinks?.whatsapp,
                phone: input.contactLinks?.phone,
              });
          const updatedAnn = await updateAnnouncementUseCase.execute({
            providerId: input.providerId ?? ctx.session.user.id,
            announcementId: input.id,
            title: input.title,
            subtitle: input.subtitle,
            description: input.description,
            priceCents: input.priceCents,
            imageUrl: input.imageUrl,
            categoryId: input.categoryId,
            tags: input.tags,
            contact,
            cta: toCta(input.cta),
            showVerifiedBadge: input.showVerifiedBadge,
          });

          return updatedAnn.toDTO();
        } catch (error) {
          if (error instanceof AnnouncementUpdateAccessDeniedError) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: error.message,
              cause: error,
            });
          }

          if (error instanceof VerifiedBadgeEligibilityError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
              cause: error,
            });
          }

          throw toCtaAwareTRPCError(error);
        }
      }),
  };
}
