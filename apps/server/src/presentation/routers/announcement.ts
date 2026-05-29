import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CreateAnnouncement } from '../../application/use-cases/announcement/create-announcement';
import { GeneratePaymentIntent } from '../../application/use-cases/payment/generate-payment-intent';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzlePaymentRepository } from '../../infrastructure/db/payment-repository';
import { AbacatePayClient } from '../../infrastructure/payment/abacatepay.client';
import { protectedProcedure, router } from '../trpc';

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

export const announcementRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        condominiumId: z.string().min(1),
        title: z.string().min(3).max(100),
        subtitle: z.string().nullable().optional(),
        description: z.string().min(10).max(2000),
        priceCents: z.number().nullable().optional(),
        imageUrl: z.string().min(1),
        category: z.string().min(1),
        tags: z.array(z.string()),
        contactLinks: z.object({
          whatsapp: z.string().optional(),
          instagram: z.string().optional(),
          website: z.string().optional(),
        }),
        showVerifiedBadge: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return createAnnouncementUseCase.execute({
        providerId: ctx.session.user.id,
        condominiumId: input.condominiumId,
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
});
