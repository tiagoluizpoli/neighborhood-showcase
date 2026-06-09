import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createSpectrumRouterDependencies } from '../../main/di/spectrum-router';
import { DomainError } from '../../shared/domain-error';
import { protectedProcedure, router } from '../trpc';

export function createSpectrumRouter(
  dependencies = createSpectrumRouterDependencies(),
) {
  const { getSpectrumOverviewUseCase } = dependencies;

  return router({
    overview: protectedProcedure
      .input(
        z.object({
          periodStart: z.string().datetime(),
          periodEnd: z.string().datetime(),
        }),
      )
      .query(async ({ input, ctx }) => {
        if (ctx.session.user.role !== 'ADMINISTRATOR') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
        }

        try {
          const result = await getSpectrumOverviewUseCase.execute({
            periodStart: new Date(input.periodStart),
            periodEnd: new Date(input.periodEnd),
          });

          return {
            activeProviders: result.activeProviders,
            totalAnnouncements: result.totalAnnouncements,
            flaggedForReview: result.flaggedForReview,
            newUserSignups: result.newUserSignups,
            periodStart: result.periodStart.toISOString(),
            periodEnd: result.periodEnd.toISOString(),
          };
        } catch (error) {
          if (error instanceof DomainError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
            });
          }
          throw error;
        }
      }),
  });
}

export const spectrumRouter = createSpectrumRouter();
