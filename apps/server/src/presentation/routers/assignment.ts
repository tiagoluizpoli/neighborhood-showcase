import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  AssignmentNotFoundError,
  AssignmentWithoutCondominiumError,
} from '../../application/use-cases/assignment/get-condominium-assignment';
import { InvalidAddressError } from '../../application/use-cases/assignment/register-external-location';
import type { AssignmentRepository } from '../../domain/repositories/assignment.repository';
import { createAssignmentRouterDependencies } from '../../main/di';
import { protectedProcedure, router } from '../trpc';

const checkModerator = async (
  userId: string,
  condominiumId: string,
  assignmentRepo: AssignmentRepository,
) => {
  const existing = await assignmentRepo.findByProviderAndCondo(
    userId,
    condominiumId,
  );
  if (
    !existing ||
    existing.type !== 'MODERATOR' ||
    existing.status !== 'APPROVED'
  ) {
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
          condominiumId: z.string().min(1),
          unitInfo: z.string().min(1).max(100),
          proofOfResidency: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const assign = await requestAssignmentUseCase.execute({
          providerId: ctx.session.user.id,
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
        try {
          const result = await registerExternalUseCase.execute({
            providerId: ctx.session.user.id,
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
