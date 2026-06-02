import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ApproveAssignment } from '../../application/use-cases/assignment/approve-assignment';
import { RegisterExternalLocation } from '../../application/use-cases/assignment/register-external-location';
import { RejectAssignment } from '../../application/use-cases/assignment/reject-assignment';
import { RequestAssignment } from '../../application/use-cases/assignment/request-assignment';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { protectedProcedure, router } from '../trpc';

const assignmentRepo = new DrizzleAssignmentRepository();
const requestAssignmentUseCase = new RequestAssignment(assignmentRepo);
const approveAssignmentUseCase = new ApproveAssignment(assignmentRepo);
const rejectAssignmentUseCase = new RejectAssignment(assignmentRepo);
const registerExternalUseCase = new RegisterExternalLocation(assignmentRepo);

const checkModerator = async (userId: string, condominiumId: string) => {
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

export const assignmentRouter = router({
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
    const results = await assignmentRepo.findByProviderId(ctx.session.user.id);
    return results.map((assign) => ({
      ...assign.toDTO(),
      condominium: assign.condominium,
    }));
  }),

  listPending: protectedProcedure
    .input(z.object({ condominiumId: z.string() }))
    .query(async ({ input, ctx }) => {
      await checkModerator(ctx.session.user.id, input.condominiumId);
      const results = await assignmentRepo.findPendingByCondoId(
        input.condominiumId,
      );
      return results.map((assign) => ({
        ...assign.toDTO(),
        provider: assign.provider,
      }));
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const assign = await assignmentRepo.findById(input.id);
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
      await checkModerator(ctx.session.user.id, assign.condominiumId);
      const result = await approveAssignmentUseCase.execute({ id: input.id });
      return result.toDTO();
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const assign = await assignmentRepo.findById(input.id);
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
      await checkModerator(ctx.session.user.id, assign.condominiumId);
      const result = await rejectAssignmentUseCase.execute({
        id: input.id,
        reason: input.reason,
      });
      return result.toDTO();
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
    }),
});
