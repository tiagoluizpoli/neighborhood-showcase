import { protectedProcedure, publicProcedure, router } from '../trpc';
import { assignmentRouter } from './assignment';
import { condominiumRouter } from './condominium';
import { todoRouter } from './todo';

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return 'OK';
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: 'This is private',
      user: ctx.session.user,
    };
  }),
  todo: todoRouter,
  condominium: condominiumRouter,
  assignment: assignmentRouter,
});

export type AppRouter = typeof appRouter;
