import { z } from 'zod';
import { RequestCondominium } from '../../application/use-cases/condominium/request-condominium';
import { DrizzleCondominiumRepository } from '../../infrastructure/db/condominium-repository';
import { protectedProcedure, publicProcedure, router } from '../trpc';

const condoRepo = new DrizzleCondominiumRepository();
const requestCondoUseCase = new RequestCondominium(condoRepo);

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
});
