import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  assignment as assignmentSchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { CreateAnnouncement } from '../../application/use-cases/announcement/create-announcement';
import { GetProviderDashboardData } from '../../application/use-cases/announcement/get-provider-dashboard-data';
import { ListPublicAnnouncements } from '../../application/use-cases/announcement/list-public-announcements';
import { ReinstateAnnouncement } from '../../application/use-cases/announcement/reinstate-announcement';
import { SuspendAnnouncement } from '../../application/use-cases/announcement/suspend-announcement';
import { TrackAnalyticsEvent } from '../../application/use-cases/announcement/track-analytics-event';
import { GeneratePaymentIntent } from '../../application/use-cases/payment/generate-payment-intent';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzlePaymentRepository } from '../../infrastructure/db/payment-repository';
import { AbacatePayClient } from '../../infrastructure/payment/abacatepay.client';
import { protectedProcedure, publicProcedure, router } from '../trpc';

const announcementRepo = new DrizzleAnnouncementRepository();
const assignmentRepo = new DrizzleAssignmentRepository();
const paymentRepo = new DrizzlePaymentRepository();
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

const listPublicAnnouncementsUseCase = new ListPublicAnnouncements();
const trackAnalyticsEventUseCase = new TrackAnalyticsEvent();
const getProviderDashboardDataUseCase = new GetProviderDashboardData();
const suspendAnnouncementUseCase = new SuspendAnnouncement();
const reinstateAnnouncementUseCase = new ReinstateAnnouncement();

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
        category: z.string().min(1),
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
        category: input.category,
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
      const paymentRecord = await paymentRepo.findByAnnouncementId(
        input.announcementId,
      );

      if (!paymentRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Nenhum pagamento registrado para este anúncio.',
        });
      }

      // Verify ownership of the announcement
      const ann = await announcementRepo.findById(input.announcementId);
      if (!ann || ann.providerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado. Você não é o proprietário deste anúncio.',
        });
      }

      return {
        id: paymentRecord.id,
        status: paymentRecord.status,
        billingId: paymentRecord.billingId,
      };
    }),

  listPublic: publicProcedure
    .input(
      z.object({
        condominiumId: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        verifiedOnly: z.boolean().optional(),
        userCondoId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return listPublicAnnouncementsUseCase.execute({
        condominiumId: input.condominiumId,
        category: input.category,
        search: input.search,
        verifiedOnly: input.verifiedOnly,
        userCondoId: input.userCondoId,
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
      const ann = await announcementRepo.findById(input.id);
      if (!ann || ann.status !== 'ACTIVE') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Anúncio não encontrado ou inativo.',
        });
      }

      let condoName = '';
      let condoCity = '';
      let condoState = '';

      if (ann.condominiumId) {
        const [condo] = await db
          .select()
          .from(condominiumSchema)
          .where(eq(condominiumSchema.id, ann.condominiumId))
          .limit(1);
        if (condo) {
          condoName = condo.name;
          condoCity = condo.city;
          condoState = condo.state;
        }
      } else if (ann.providerLocationId) {
        const [loc] = await db
          .select({
            city: addressSchema.city,
            state: addressSchema.state,
          })
          .from(providerLocationSchema)
          .innerJoin(
            addressSchema,
            eq(providerLocationSchema.addressId, addressSchema.id),
          )
          .where(eq(providerLocationSchema.id, ann.providerLocationId))
          .limit(1);
        if (loc) {
          condoCity = loc.city;
          condoState = loc.state;
        }
      }

      return {
        ...ann.toDTO(),
        condoName,
        condoCity,
        condoState,
      };
    }),

  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    return getProviderDashboardDataUseCase.execute({
      providerId: ctx.session.user.id,
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
        category: z.string().min(1),
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
      const ann = await announcementRepo.findById(input.id);
      if (!ann || ann.providerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado. Você não é o proprietário deste anúncio.',
        });
      }

      const newStatus = ann.status === 'SUSPENDED' ? 'ACTIVE' : ann.status;

      const updatedAnn = await announcementRepo.update(input.id, {
        title: input.title,
        subtitle: input.subtitle,
        description: input.description,
        priceCents: input.priceCents,
        imageUrl: input.imageUrl,
        category: input.category,
        tags: input.tags,
        contactLinks: input.contactLinks,
        showVerifiedBadge: input.showVerifiedBadge,
        status: newStatus as
          | 'DRAFT'
          | 'PENDING_PAYMENT'
          | 'ACTIVE'
          | 'EXPIRED'
          | 'SUSPENDED',
        flaggedForReview: true,
        suspensionReason: null,
      });

      return updatedAnn.toDTO();
    }),

  listForModeration: protectedProcedure
    .input(
      z.object({
        condominiumId: z.string().min(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify moderator role for this condo
      const [isMod] = await db
        .select()
        .from(assignmentSchema)
        .where(
          and(
            eq(assignmentSchema.providerId, ctx.session.user.id),
            eq(assignmentSchema.condominiumId, input.condominiumId),
            eq(assignmentSchema.type, 'MODERATOR'),
            eq(assignmentSchema.status, 'APPROVED'),
          ),
        )
        .limit(1);

      if (!isMod) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado. Você não é moderador deste condomínio.',
        });
      }

      // Query active or suspended announcements
      const ads = await db
        .select({
          id: announcementSchema.id,
          title: announcementSchema.title,
          subtitle: announcementSchema.subtitle,
          description: announcementSchema.description,
          priceCents: announcementSchema.priceCents,
          imageUrl: announcementSchema.imageUrl,
          category: announcementSchema.category,
          tags: announcementSchema.tags,
          contactLinks: announcementSchema.contactLinks,
          showVerifiedBadge: announcementSchema.showVerifiedBadge,
          flaggedForReview: announcementSchema.flaggedForReview,
          status: announcementSchema.status,
          suspensionReason: announcementSchema.suspensionReason,
          createdAt: announcementSchema.createdAt,
          providerName: userSchema.name,
        })
        .from(announcementSchema)
        .innerJoin(userSchema, eq(announcementSchema.providerId, userSchema.id))
        .where(
          and(
            eq(announcementSchema.condominiumId, input.condominiumId),
            inArray(announcementSchema.status, ['ACTIVE', 'SUSPENDED']),
            isNull(announcementSchema.deletedAt),
          ),
        );

      return ads;
    }),

  suspend: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await suspendAnnouncementUseCase.execute({
        announcementId: input.id,
        moderatorId: ctx.session.user.id,
        reason: input.reason,
      });
      return { success: true };
    }),

  reinstate: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await reinstateAnnouncementUseCase.execute({
        announcementId: input.id,
        moderatorId: ctx.session.user.id,
      });
      return { success: true };
    }),
});
