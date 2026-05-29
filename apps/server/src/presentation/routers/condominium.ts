import { z } from 'zod';
import { ApproveCondominium } from '../../application/use-cases/condominium/approve-condominium';
import { RejectCondominium } from '../../application/use-cases/condominium/reject-condominium';
import { RequestCondominium } from '../../application/use-cases/condominium/request-condominium';
import { DrizzleAssignmentRepository } from '../../infrastructure/db/assignment-repository';
import { DrizzleCondominiumRepository } from '../../infrastructure/db/condominium-repository';
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../trpc';

const condoRepo = new DrizzleCondominiumRepository();
const assignmentRepo = new DrizzleAssignmentRepository();

const requestCondoUseCase = new RequestCondominium(condoRepo);
const approveCondoUseCase = new ApproveCondominium(condoRepo, assignmentRepo);
const rejectCondoUseCase = new RejectCondominium(condoRepo);

export const condominiumRouter = router({
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
      return requestCondoUseCase.execute({
        name: input.name,
        city: input.city,
        state: input.state,
        cep: input.cep,
        contactInfo: input.contactInfo,
        createdBy: ctx.session.user.id,
        proofUrl: input.proofUrl,
      });
    }),

  myCreated: protectedProcedure.query(async ({ ctx }) => {
    return condoRepo.findByCreatorId(ctx.session.user.id);
  }),

  listApproved: publicProcedure
    .input(z.object({ query: z.string().default('') }))
    .query(async ({ input }) => {
      return condoRepo.searchApproved(input.query);
    }),

  listPending: adminProcedure.query(async () => {
    return condoRepo.listPending();
  }),

  approve: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return approveCondoUseCase.execute({ id: input.id });
    }),

  reject: adminProcedure
    .input(z.object({ id: z.string(), reason: z.string() }))
    .mutation(async ({ input }) => {
      return rejectCondoUseCase.execute({
        id: input.id,
        reason: input.reason,
      });
    }),
});
