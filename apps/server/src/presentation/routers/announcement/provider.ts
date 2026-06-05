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
          providerAssignmentId: z.string().min(1),
          title: z.string().min(3).max(100),
          subtitle: z.string().nullable().optional(),
          description: z.string().min(10).max(2000),
          priceCents: z.number().nullable().optional(),
          imageUrl: z.string().min(1),
          categoryId: z.string().min(1),
          tags: z.array(z.string()),
          contactLinks: providerContactLinksSchema,
          showVerifiedBadge: z.boolean(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ann = await createAnnouncementUseCase.execute({
          providerId: ctx.session.user.id,
          providerAssignmentId: input.providerAssignmentId,
          title: input.title,
          subtitle: input.subtitle,
          description: input.description,
          priceCents: input.priceCents,
          imageUrl: input.imageUrl,
          categoryId: input.categoryId,
          tags: input.tags,
          contactLinks: input.contactLinks,
          showVerifiedBadge: input.showVerifiedBadge,
        });

        return ann.toDTO();
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

    getDashboardData: protectedProcedure.query(async ({ ctx }) => {
      return getProviderDashboardDataUseCase.execute({
        providerId: ctx.session.user.id,
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
          id: z.string().min(1),
          title: z.string().min(3).max(100),
          subtitle: z.string().nullable().optional(),
          description: z.string().min(10).max(2000),
          priceCents: z.number().nullable().optional(),
          imageUrl: z.string().min(1),
          categoryId: z.string().min(1),
          tags: z.array(z.string()),
          contactLinks: providerContactLinksSchema,
          showVerifiedBadge: z.boolean(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const updatedAnn = await updateAnnouncementUseCase.execute({
            actorId: ctx.session.user.id,
            announcementId: input.id,
            title: input.title,
            subtitle: input.subtitle,
            description: input.description,
            priceCents: input.priceCents,
            imageUrl: input.imageUrl,
            categoryId: input.categoryId,
            tags: input.tags,
            contactLinks: input.contactLinks,
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

          throw error;
        }
      }),
  };
}
