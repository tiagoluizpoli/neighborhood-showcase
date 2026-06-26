import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  AssignmentNotFoundError,
  AssignmentWithoutCondominiumError,
} from '../../application/use-cases/assignment/get-condominium-assignment';
import { InvalidAddressError } from '../../application/use-cases/assignment/register-external-location';
import type { AssignmentRepository } from '../../domain/repositories/assignment.repository';
import { createAssignmentRouterDependencies } from '../../main/di';
import { assertProviderOwnership, protectedProcedure, router } from '../trpc';

const checkModerator = async (
  userId: string,
  condominiumId: string,
  assignmentRepo: AssignmentRepository,
) => {
  const existing = await assignmentRepo.findByProviderAndCondo(
    userId,
    condominiumId,
  );
  if (existing?.type !== 'MODERATOR' || existing.status !== 'APPROVED') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        'Apenas moderadores aprovados deste condomínio podem realizar esta ação.',
    });
  }
};

export function createAssignmentRouter(
  dependencies = createAssignmentRouterDependencies(),
) {
  const {
    assignmentRepo,
    countPendingAssignmentsUseCase,
    getCondominiumAssignmentUseCase,
    getAssignmentUseCase,
    requestAssignmentUseCase,
    listPendingAssignmentsUseCase,
    listProviderAssignmentsUseCase,
    approveAssignmentUseCase,
    rejectAssignmentUseCase,
    registerExternalUseCase,
  } = dependencies;

  return router({
    request: protectedProcedure
      .input(
        z.object({
          // Optional: the repeatable create flow (T-20-05/ST-04) passes a
          // freshly-minted providerId so a RESIDENT assignment is created for
          // the new provider. Legacy single-provider callers omit it and fall
          // back to the session id (provider.id === user.id in the seed).
          providerId: z.string().min(1).optional(),
          condominiumId: z.string().min(1),
          unitInfo: z.string().min(1).max(100),
          proofOfResidency: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const providerId = input.providerId ?? ctx.session.user.id;
        // When an explicit providerId is supplied, enforce ownership so a
        // caller cannot create an assignment for a provider they do not own.
        if (input.providerId) {
          await assertProviderOwnership({
            providerId: input.providerId,
            userId: ctx.session.user.id,
          });
        }
        const assign = await requestAssignmentUseCase.execute({
          providerId,
          condominiumId: input.condominiumId,
          unitInfo: input.unitInfo,
          proofOfResidency: input.proofOfResidency,
        });
        return assign.toDTO();
      }),

    getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
      const results = await listProviderAssignmentsUseCase.execute({
        providerId: ctx.session.user.id,
      });
      return results.map((assign) => ({
        ...assign.toDTO(),
        condominium: assign.condominium,
      }));
    }),

    listPending: protectedProcedure
      .input(z.object({ condominiumId: z.string() }))
      .query(async ({ input, ctx }) => {
        await checkModerator(
          ctx.session.user.id,
          input.condominiumId,
          assignmentRepo,
        );
        const results = await listPendingAssignmentsUseCase.execute({
          condominiumId: input.condominiumId,
        });
        return results.map((assign) => ({
          ...assign.toDTO(),
          provider: assign.provider,
        }));
      }),

    pendingCount: protectedProcedure
      .input(
        z.object({
          condominiumId: z.string(),
          type: z.enum(['MODERATOR', 'RESIDENT']).optional(),
        }),
      )
      .query(async ({ input, ctx }) => {
        // Condo-moderator-scoped: reading a condo's pending-assignment count is
        // a moderation action, gated by an APPROVED MODERATOR assignment in that
        // condo — same guard as listPending/approve/reject. (Was previously
        // ungated; closed in T-20-04/ST-02.)
        await checkModerator(
          ctx.session.user.id,
          input.condominiumId,
          assignmentRepo,
        );
        const count = await countPendingAssignmentsUseCase.execute({
          condominiumId: input.condominiumId,
          type: input.type,
        });
        return { count };
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const assign = await getAssignmentUseCase.execute({ id: input.id });
        if (!assign) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Solicitação não encontrada.',
          });
        }
        if (!assign.condominiumId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Solicitação não vinculada a um condomínio.',
          });
        }
        await checkModerator(
          ctx.session.user.id,
          assign.condominiumId,
          assignmentRepo,
        );
        const result = await approveAssignmentUseCase.execute({ id: input.id });
        return result.toDTO();
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.string(), reason: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const assign = await getCondominiumAssignmentUseCase.execute({
            id: input.id,
          });
          await checkModerator(
            ctx.session.user.id,
            assign.condominiumId,
            assignmentRepo,
          );
          const result = await rejectAssignmentUseCase.execute({
            id: input.id,
            reason: input.reason,
          });
          return result.toDTO();
        } catch (error) {
          if (error instanceof AssignmentNotFoundError) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
              cause: error,
            });
          }

          if (error instanceof AssignmentWithoutCondominiumError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
              cause: error,
            });
          }

          throw error;
        }
      }),

    registerExternal: protectedProcedure
      .input(
        z.object({
          // See `request`: the repeatable create flow passes a minted
          // providerId; legacy callers omit it.
          providerId: z.string().min(1).optional(),
          cep: z.string().min(8).max(9),
          street: z.string().min(1),
          neighborhood: z.string().min(1),
          city: z.string().min(1),
          state: z.string().length(2),
          number: z.string().min(1),
          complement: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (input.providerId) {
          await assertProviderOwnership({
            providerId: input.providerId,
            userId: ctx.session.user.id,
          });
        }
        try {
          const result = await registerExternalUseCase.execute({
            providerId: input.providerId ?? ctx.session.user.id,
            cep: input.cep,
            street: input.street,
            neighborhood: input.neighborhood,
            city: input.city,
            state: input.state,
            number: input.number,
            complement: input.complement,
          });
          return result.toDTO();
        } catch (error) {
          if (error instanceof InvalidAddressError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
              cause: error,
            });
          }
          throw error;
        }
      }),
  });
}

export const assignmentRouter = createAssignmentRouter();
