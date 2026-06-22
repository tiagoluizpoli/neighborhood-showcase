import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { AnnouncementNotFoundError } from '../../../application/use-cases/announcement/get-public-announcement';
import type { AnnouncementRouterDependencies } from '../../../main/di/announcement-router';
import { publicProcedure } from '../../trpc';

export function createPublicAnnouncementRouter(
  dependencies: AnnouncementRouterDependencies,
) {
  const {
    getPublicAnnouncementUseCase,
    listActiveCategoriesUseCase,
    listPublicAnnouncementsUseCase,
    listTagSuggestionsUseCase,
    trackAnalyticsEventUseCase,
  } = dependencies;

  return {
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

    listCategories: publicProcedure.query(async () => {
      return listActiveCategoriesUseCase.execute();
    }),

    listTagSuggestions: publicProcedure.query(async () => {
      return listTagSuggestionsUseCase.execute();
    }),
  };
}
