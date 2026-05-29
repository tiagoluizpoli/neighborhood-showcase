import { z } from 'zod';
import { RequestAssignment } from '../../application/use-cases/assignment/request-assignment';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { protectedProcedure, router } from '../trpc';

const assignmentRepo = new DrizzleAssignmentRepository();
const requestAssignmentUseCase = new RequestAssignment(assignmentRepo);

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
      return requestAssignmentUseCase.execute({
        providerId: ctx.session.user.id,
        condominiumId: input.condominiumId,
        unitInfo: input.unitInfo,
        proofOfResidency: input.proofOfResidency,
      });
    }),

  getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
    return assignmentRepo.findByProviderId(ctx.session.user.id);
  }),
});
