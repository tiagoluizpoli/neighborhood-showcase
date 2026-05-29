import { protectedProcedure, publicProcedure, router } from '../trpc';
import { adminRouter } from './admin';
import { announcementRouter } from './announcement';
import { assignmentRouter } from './assignment';
import { condominiumRouter } from './condominium';
import { todoRouter } from './todo';
import { userRouter } from './user';

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
  announcement: announcementRouter,
  user: userRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
