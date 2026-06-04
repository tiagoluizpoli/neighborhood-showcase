import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CreateAnnouncement } from '../../application/use-cases/announcement/create-announcement';
import type {
  DismissReportsAccessDeniedError,
  DismissReportsActorNotFoundError,
  DismissReportsNoBoundError,
  DismissReportsNotFoundError,
} from '../../application/use-cases/announcement/dismiss-reports';
import { DismissReports } from '../../application/use-cases/announcement/dismiss-reports';
import { GetAnnouncementAnalytics } from '../../application/use-cases/announcement/get-announcement-analytics';
import { GetProviderDashboardData } from '../../application/use-cases/announcement/get-provider-dashboard-data';
import {
  AnnouncementNotFoundError,
  GetPublicAnnouncement,
} from '../../application/use-cases/announcement/get-public-announcement';
import { ListActiveCategories } from '../../application/use-cases/announcement/list-active-categories';
import {
  ListAnnouncementsForModeration,
  ModerationAccessDeniedError,
} from '../../application/use-cases/announcement/list-announcements-for-moderation';
import { ListPublicAnnouncements } from '../../application/use-cases/announcement/list-public-announcements';
import {
  ListReportedAnnouncements,
  ReportQueueAccessDeniedError,
  ReportQueueActorNotFoundError,
} from '../../application/use-cases/announcement/list-reported-announcements';
import {
  ReinstateAnnouncement,
  type ReinstateAnnouncementAccessDeniedError,
  type ReinstateAnnouncementActorNotFoundError,
  type ReinstateAnnouncementNoBoundError,
  type ReinstateAnnouncementNotFoundError,
} from '../../application/use-cases/announcement/reinstate-announcement';
import {
  AnnouncementReportConflictError,
  AnnouncementReportNotFoundError,
  ReportAnnouncement,
} from '../../application/use-cases/announcement/report-announcement';
import {
  SuspendAnnouncement,
  type SuspendAnnouncementAccessDeniedError,
  type SuspendAnnouncementActorNotFoundError,
  type SuspendAnnouncementNoBoundError,
  type SuspendAnnouncementNotFoundError,
} from '../../application/use-cases/announcement/suspend-announcement';
import { TrackAnalyticsEvent } from '../../application/use-cases/announcement/track-analytics-event';
import {
  AnnouncementUpdateAccessDeniedError,
  UpdateAnnouncement,
  VerifiedBadgeEligibilityError,
} from '../../application/use-cases/announcement/update-announcement';
import { GeneratePaymentIntent } from '../../application/use-cases/payment/generate-payment-intent';
import {
  AnnouncementAccessDeniedError,
  GetPaymentStatus,
  PaymentNotFoundError,
} from '../../application/use-cases/payment/get-payment-status';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleCategoryRepository } from '../../infrastructure/db/category-repository';
import { DrizzlePaymentRepository } from '../../infrastructure/db/payment-repository';
import { DrizzleReportRepository } from '../../infrastructure/db/report-repository';
import { DrizzleUserRepository } from '../../infrastructure/db/user-repository';
import { AbacatePayClient } from '../../infrastructure/payment/abacatepay.client';
import { protectedProcedure, publicProcedure, router } from '../trpc';

const announcementRepo = new DrizzleAnnouncementRepository();
const assignmentRepo = new DrizzleAssignmentRepository();
const categoryRepo = new DrizzleCategoryRepository();
const paymentRepo = new DrizzlePaymentRepository();
const reportRepo = new DrizzleReportRepository();
const userRepo = new DrizzleUserRepository();
const abacatePayClient = new AbacatePayClient();

const createAnnouncementUseCase = new CreateAnnouncement(
  announcementRepo,
  assignmentRepo,
);

const generatePaymentIntentUseCase = new GeneratePaymentIntent(
  announcementRepo,
  paymentRepo,
  abacatePayClient,
);
const getPaymentStatusUseCase = new GetPaymentStatus(
  announcementRepo,
  paymentRepo,
);
const listAnnouncementsForModerationUseCase =
  new ListAnnouncementsForModeration(announcementRepo, assignmentRepo);
const getPublicAnnouncementUseCase = new GetPublicAnnouncement(
  announcementRepo,
);
const updateAnnouncementUseCase = new UpdateAnnouncement(
  announcementRepo,
  assignmentRepo,
);

const listPublicAnnouncementsUseCase = new ListPublicAnnouncements();
const listActiveCategoriesUseCase = new ListActiveCategories(categoryRepo);
const trackAnalyticsEventUseCase = new TrackAnalyticsEvent();
const getProviderDashboardDataUseCase = new GetProviderDashboardData();
const getAnnouncementAnalyticsUseCase = new GetAnnouncementAnalytics();
const suspendAnnouncementUseCase = new SuspendAnnouncement(
  announcementRepo,
  assignmentRepo,
  userRepo,
);
const reinstateAnnouncementUseCase = new ReinstateAnnouncement(
  announcementRepo,
  assignmentRepo,
  userRepo,
);
const reportAnnouncementUseCase = new ReportAnnouncement(
  announcementRepo,
  reportRepo,
);
const dismissReportsUseCase = new DismissReports(
  announcementRepo,
  assignmentRepo,
  reportRepo,
  userRepo,
);
const listReportedAnnouncementsUseCase = new ListReportedAnnouncements(
  announcementRepo,
  assignmentRepo,
  userRepo,
);

export const announcementRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        providerLocationId: z.string().min(1),
        title: z.string().min(3).max(100),
        subtitle: z.string().nullable().optional(),
        description: z.string().min(10).max(2000),
        priceCents: z.number().nullable().optional(),
        imageUrl: z.string().min(1),
        categoryId: z.string().min(1),
        tags: z.array(z.string()),
        contactLinks: z.object({
          whatsapp: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          instagram: z.string().optional(),
          tiktok: z.string().optional(),
          facebook: z.string().optional(),
          website: z.string().optional(),
        }),
        showVerifiedBadge: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ann = await createAnnouncementUseCase.execute({
        providerId: ctx.session.user.id,
        providerLocationId: input.providerLocationId,
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

  listPublic: publicProcedure
    .input(
      z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        condominiumId: z.string().optional(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        verifiedOnly: z.boolean().optional(),
        userCondoId: z.string().optional(),
        radiusKm: z.number().max(25).optional(),
        city: z.string().optional(),
        neighborhood: z.string().optional(),
        ipCity: z.string().optional(),
        ipState: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return listPublicAnnouncementsUseCase.execute({
        latitude: input.latitude,
        longitude: input.longitude,
        condominiumId: input.condominiumId,
        categoryId: input.categoryId,
        search: input.search,
        verifiedOnly: input.verifiedOnly,
        userCondoId: input.userCondoId,
        radiusKm: input.radiusKm,
        city: input.city,
        neighborhood: input.neighborhood,
        ipCity: input.ipCity,
        ipState: input.ipState,
      });
    }),

  trackEvent: publicProcedure
    .input(
      z.object({
        announcementId: z.string().min(1),
        eventType: z.enum(['IMPRESSION', 'CONTACT_CLICK']),
        targetType: z
          .enum(['WHATSAPP', 'INSTAGRAM', 'WEBSITE'])
          .nullable()
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return trackAnalyticsEventUseCase.execute({
        announcementId: input.announcementId,
        eventType: input.eventType,
        targetType: input.targetType,
      });
    }),

  getPublic: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await getPublicAnnouncementUseCase.execute({
          id: input.id,
        });
      } catch (error) {
        if (error instanceof AnnouncementNotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
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
      return getAnnouncementAnalyticsUseCase.execute({
        announcementId: input.announcementId,
        providerId: ctx.session.user.id,
        period: input.period,
      });
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
        contactLinks: z.object({
          whatsapp: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          instagram: z.string().optional(),
          tiktok: z.string().optional(),
          facebook: z.string().optional(),
          website: z.string().optional(),
        }),
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

  listForModeration: protectedProcedure
    .input(
      z.object({
        condominiumId: z.string().min(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await listAnnouncementsForModerationUseCase.execute({
          actorId: ctx.session.user.id,
          condominiumId: input.condominiumId,
        });
      } catch (error) {
        if (error instanceof ModerationAccessDeniedError) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
            cause: error,
          });
        }

        throw error;
      }
    }),

  suspend: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await suspendAnnouncementUseCase.execute({
          announcementId: input.id,
          moderatorId: ctx.session.user.id,
          reason: input.reason,
        });
        return { success: true };
      } catch (error) {
        if (
          (error as SuspendAnnouncementNotFoundError).name ===
          'SuspendAnnouncementNotFoundError'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: (error as SuspendAnnouncementNotFoundError).message,
            cause: error,
          });
        }
        if (
          (error as SuspendAnnouncementNoBoundError).name ===
          'SuspendAnnouncementNoBoundError'
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: (error as SuspendAnnouncementNoBoundError).message,
            cause: error,
          });
        }
        if (
          (error as SuspendAnnouncementActorNotFoundError).name ===
          'SuspendAnnouncementActorNotFoundError'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: (error as SuspendAnnouncementActorNotFoundError).message,
            cause: error,
          });
        }
        if (
          (error as SuspendAnnouncementAccessDeniedError).name ===
          'SuspendAnnouncementAccessDeniedError'
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: (error as SuspendAnnouncementAccessDeniedError).message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  reinstate: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await reinstateAnnouncementUseCase.execute({
          announcementId: input.id,
          moderatorId: ctx.session.user.id,
        });
        return { success: true };
      } catch (error) {
        if (
          (error as ReinstateAnnouncementNotFoundError).name ===
          'ReinstateAnnouncementNotFoundError'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: (error as ReinstateAnnouncementNotFoundError).message,
            cause: error,
          });
        }
        if (
          (error as ReinstateAnnouncementNoBoundError).name ===
          'ReinstateAnnouncementNoBoundError'
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: (error as ReinstateAnnouncementNoBoundError).message,
            cause: error,
          });
        }
        if (
          (error as ReinstateAnnouncementActorNotFoundError).name ===
          'ReinstateAnnouncementActorNotFoundError'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: (error as ReinstateAnnouncementActorNotFoundError).message,
            cause: error,
          });
        }
        if (
          (error as ReinstateAnnouncementAccessDeniedError).name ===
          'ReinstateAnnouncementAccessDeniedError'
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: (error as ReinstateAnnouncementAccessDeniedError).message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  report: protectedProcedure
    .input(
      z.object({
        announcementId: z.string().min(1),
        reason: z.enum([
          'FRAUDE_GOLPE',
          'ASSEDIO_OFENSIVO',
          'SPAM',
          'SERVICO_ILEGAL',
          'OUTROS',
        ]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await reportAnnouncementUseCase.execute({
          reporterId: ctx.session.user.id,
          announcementId: input.announcementId,
          reason: input.reason,
        });
        return { success: true };
      } catch (error) {
        if (error instanceof AnnouncementReportNotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
            cause: error,
          });
        }

        if (error instanceof AnnouncementReportConflictError) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
            cause: error,
          });
        }

        throw error;
      }
    }),

  listReported: protectedProcedure
    .input(
      z.object({
        threshold: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return await listReportedAnnouncementsUseCase.execute({
          actorId: ctx.session.user.id,
          threshold: input.threshold,
        });
      } catch (error) {
        if (error instanceof ReportQueueActorNotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
            cause: error,
          });
        }

        if (error instanceof ReportQueueAccessDeniedError) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
            cause: error,
          });
        }

        throw error;
      }
    }),

  dismissReports: protectedProcedure
    .input(
      z.object({
        announcementId: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await dismissReportsUseCase.execute({
          announcementId: input.announcementId,
          moderatorId: ctx.session.user.id,
        });
        return { success: true };
      } catch (error) {
        if (
          (error as DismissReportsNotFoundError).name ===
          'DismissReportsNotFoundError'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: (error as DismissReportsNotFoundError).message,
            cause: error,
          });
        }
        if (
          (error as DismissReportsActorNotFoundError).name ===
          'DismissReportsActorNotFoundError'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: (error as DismissReportsActorNotFoundError).message,
            cause: error,
          });
        }
        if (
          (error as DismissReportsNoBoundError).name ===
          'DismissReportsNoBoundError'
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: (error as DismissReportsNoBoundError).message,
            cause: error,
          });
        }
        if (
          (error as DismissReportsAccessDeniedError).name ===
          'DismissReportsAccessDeniedError'
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: (error as DismissReportsAccessDeniedError).message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  listCategories: publicProcedure.query(async () => {
    return listActiveCategoriesUseCase.execute();
  }),
});
