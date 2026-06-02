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
    const condo = await condoRepo.findByCreatorId(ctx.session.user.id);
    return condo ? condo.toDTO() : null;
  }),

  listApproved: publicProcedure
    .input(z.object({ query: z.string().default('') }))
    .query(async ({ input }) => {
      const results = await condoRepo.searchApproved(input.query);
      return results.map((condo) => condo.toDTO());
    }),

  listPending: adminProcedure.query(async () => {
    const results = await condoRepo.listPending();
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
      const condo = await rejectCondoUseCase.execute({
        id: input.id,
        reason: input.reason,
      });
      return condo.toDTO();
    }),
});
