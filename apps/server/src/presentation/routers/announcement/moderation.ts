import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type {
  DismissReportsAccessDeniedError,
  DismissReportsActorNotFoundError,
  DismissReportsNoBoundError,
  DismissReportsNotFoundError,
} from '../../../application/use-cases/announcement/dismiss-reports';
import { ModerationAccessDeniedError } from '../../../application/use-cases/announcement/list-announcements-for-moderation';
import {
  ReportQueueAccessDeniedError,
  ReportQueueActorNotFoundError,
} from '../../../application/use-cases/announcement/list-reported-announcements';
import type {
  ReinstateAnnouncementAccessDeniedError,
  ReinstateAnnouncementActorNotFoundError,
  ReinstateAnnouncementNoBoundError,
  ReinstateAnnouncementNotFoundError,
} from '../../../application/use-cases/announcement/reinstate-announcement';
import {
  AnnouncementReportConflictError,
  AnnouncementReportNotFoundError,
} from '../../../application/use-cases/announcement/report-announcement';
import type {
  SuspendAnnouncementAccessDeniedError,
  SuspendAnnouncementActorNotFoundError,
  SuspendAnnouncementNoBoundError,
  SuspendAnnouncementNotFoundError,
} from '../../../application/use-cases/announcement/suspend-announcement';
import type { AnnouncementRouterDependencies } from '../../../main/di/announcement-router';
import { protectedProcedure } from '../../trpc';

function createRouterError(
  code: 'BAD_REQUEST' | 'CONFLICT' | 'FORBIDDEN' | 'NOT_FOUND',
  error: Error,
) {
  return new TRPCError({
    code,
    message: error.message,
    cause: error,
  });
}

export function createModerationAnnouncementRouter(
  dependencies: AnnouncementRouterDependencies,
) {
  const {
    countPendingAnnouncementsUseCase,
    listAnnouncementsForModerationUseCase,
    suspendAnnouncementUseCase,
    reinstateAnnouncementUseCase,
    reportAnnouncementUseCase,
    dismissReportsUseCase,
    listReportedAnnouncementsUseCase,
  } = dependencies;

  return {
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
            throw createRouterError('FORBIDDEN', error);
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
            throw createRouterError(
              'NOT_FOUND',
              error as SuspendAnnouncementNotFoundError,
            );
          }
          if (
            (error as SuspendAnnouncementNoBoundError).name ===
            'SuspendAnnouncementNoBoundError'
          ) {
            throw createRouterError(
              'BAD_REQUEST',
              error as SuspendAnnouncementNoBoundError,
            );
          }
          if (
            (error as SuspendAnnouncementActorNotFoundError).name ===
            'SuspendAnnouncementActorNotFoundError'
          ) {
            throw createRouterError(
              'NOT_FOUND',
              error as SuspendAnnouncementActorNotFoundError,
            );
          }
          if (
            (error as SuspendAnnouncementAccessDeniedError).name ===
            'SuspendAnnouncementAccessDeniedError'
          ) {
            throw createRouterError(
              'FORBIDDEN',
              error as SuspendAnnouncementAccessDeniedError,
            );
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
            throw createRouterError(
              'NOT_FOUND',
              error as ReinstateAnnouncementNotFoundError,
            );
          }
          if (
            (error as ReinstateAnnouncementNoBoundError).name ===
            'ReinstateAnnouncementNoBoundError'
          ) {
            throw createRouterError(
              'BAD_REQUEST',
              error as ReinstateAnnouncementNoBoundError,
            );
          }
          if (
            (error as ReinstateAnnouncementActorNotFoundError).name ===
            'ReinstateAnnouncementActorNotFoundError'
          ) {
            throw createRouterError(
              'NOT_FOUND',
              error as ReinstateAnnouncementActorNotFoundError,
            );
          }
          if (
            (error as ReinstateAnnouncementAccessDeniedError).name ===
            'ReinstateAnnouncementAccessDeniedError'
          ) {
            throw createRouterError(
              'FORBIDDEN',
              error as ReinstateAnnouncementAccessDeniedError,
            );
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
            throw createRouterError('NOT_FOUND', error);
          }
          if (error instanceof AnnouncementReportConflictError) {
            throw createRouterError('CONFLICT', error);
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
            throw createRouterError('NOT_FOUND', error);
          }
          if (error instanceof ReportQueueAccessDeniedError) {
            throw createRouterError('FORBIDDEN', error);
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
            throw createRouterError(
              'NOT_FOUND',
              error as DismissReportsNotFoundError,
            );
          }
          if (
            (error as DismissReportsActorNotFoundError).name ===
            'DismissReportsActorNotFoundError'
          ) {
            throw createRouterError(
              'NOT_FOUND',
              error as DismissReportsActorNotFoundError,
            );
          }
          if (
            (error as DismissReportsNoBoundError).name ===
            'DismissReportsNoBoundError'
          ) {
            throw createRouterError(
              'FORBIDDEN',
              error as DismissReportsNoBoundError,
            );
          }
          if (
            (error as DismissReportsAccessDeniedError).name ===
            'DismissReportsAccessDeniedError'
          ) {
            throw createRouterError(
              'FORBIDDEN',
              error as DismissReportsAccessDeniedError,
            );
          }

          throw error;
        }
      }),

    pendingCount: protectedProcedure
      .input(z.object({ condominiumId: z.string().min(1) }))
      .query(async ({ input }) => {
        const count = await countPendingAnnouncementsUseCase.execute({
          condominiumId: input.condominiumId,
        });
        return { count };
      }),
  };
}
