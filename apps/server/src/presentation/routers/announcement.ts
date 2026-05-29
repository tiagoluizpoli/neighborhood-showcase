import { z } from 'zod';
import { CreateAnnouncement } from '../../application/use-cases/announcement/create-announcement';
import { DrizzleAnnouncementRepository } from '../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { protectedProcedure, router } from '../trpc';

const announcementRepo = new DrizzleAnnouncementRepository();
const assignmentRepo = new DrizzleAssignmentRepository();
const createAnnouncementUseCase = new CreateAnnouncement(
  announcementRepo,
  assignmentRepo,
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
});
