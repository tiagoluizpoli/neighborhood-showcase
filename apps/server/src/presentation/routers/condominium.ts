import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { UnauthorizedCondominiumAccessError } from '../../application/use-cases/condominium/get-condominium-info';
import {
  CondominiumNotFoundError,
  CondominiumNotPendingError,
  RejectReasonRequiredError,
} from '../../application/use-cases/condominium/reject-condominium';
import { createCondominiumRouterDependencies } from '../../main/di';
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../trpc';

export function createCondominiumRouter(
  dependencies = createCondominiumRouterDependencies(),
) {
  const {
    requestCondoUseCase,
    approveCondoUseCase,
    rejectCondoUseCase,
    getMyCondoUseCase,
    listApprovedCondoUseCase,
    listNearbyCondoUseCase,
    listPendingCondoUseCase,
    getCondominiumInfoUseCase,
  } = dependencies;

  return router({
    request: protectedProcedure
      .input(
        z.object({
          name: z.string().min(3),
          city: z.string().min(1),
          state: z.string().min(2).max(2),
          cep: z.string().min(8),
          contactInfo: z.object({
            website: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
          }),
          proofUrl: z.string().optional().nullable(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const condo = await requestCondoUseCase.execute({
          name: input.name,
          city: input.city,
          state: input.state,
          cep: input.cep,
          contactInfo: input.contactInfo,
          createdBy: ctx.session.user.id,
          proofUrl: input.proofUrl,
        });
        return condo.toDTO();
      }),

    myCreated: protectedProcedure.query(async ({ ctx }) => {
      const condo = await getMyCondoUseCase.execute({
        userId: ctx.session.user.id,
      });
      return condo ? condo.toDTO() : null;
    }),

    listApproved: publicProcedure
      .input(z.object({ query: z.string().default('') }))
      .query(async ({ input }) => {
        const results = await listApprovedCondoUseCase.execute({
          query: input.query,
        });
        return results.map((condo) => condo.toDTO());
      }),

    listNearby: publicProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
          radiusInMeters: z.number().default(1000),
        }),
      )
      .query(async ({ input }) => {
        const results = await listNearbyCondoUseCase.execute({
          latitude: input.latitude,
          longitude: input.longitude,
          radiusInMeters: input.radiusInMeters,
        });
        return results.map((row) => ({
          condo: row.condo.toDTO(),
          distance: row.distance,
        }));
      }),

    listPending: adminProcedure.query(async () => {
      const results = await listPendingCondoUseCase.execute();
      return results.map((condo) => condo.toDTO());
    }),

    approve: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const condo = await approveCondoUseCase.execute({ id: input.id });
        return condo.toDTO();
      }),

    reject: adminProcedure
      .input(z.object({ id: z.string(), reason: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const condo = await rejectCondoUseCase.execute({
            id: input.id,
            reason: input.reason,
          });
          return condo.toDTO();
        } catch (error) {
          if (error instanceof RejectReasonRequiredError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
              cause: error,
            });
          }
          if (error instanceof CondominiumNotFoundError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
              cause: error,
            });
          }
          if (error instanceof CondominiumNotPendingError) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: error.message,
              cause: error,
            });
          }
          throw error;
        }
      }),

    getCondominiumInfo: protectedProcedure
      .input(z.object({ condominiumId: z.string() }))
      .query(async ({ input, ctx }) => {
        try {
          const result = await getCondominiumInfoUseCase.execute({
            userId: ctx.session.user.id,
            condominiumId: input.condominiumId,
          });
          return result;
        } catch (error) {
          if (error instanceof UnauthorizedCondominiumAccessError) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: error.message,
              cause: error,
            });
          }
          if (error instanceof CondominiumNotFoundError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
              cause: error,
            });
          }
          throw error;
        }
      }),
  });
}

export const condominiumRouter = createCondominiumRouter();
