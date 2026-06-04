import { adminRouter } from '../presentation/routers/admin';
import { announcementRouter } from '../presentation/routers/announcement';
import { assignmentRouter } from '../presentation/routers/assignment';
import { condominiumRouter } from '../presentation/routers/condominium';
import { userRouter } from '../presentation/routers/user';
import {
  protectedProcedure,
  publicProcedure,
  router,
} from '../presentation/trpc';

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
  condominium: condominiumRouter,
  assignment: assignmentRouter,
  announcement: announcementRouter,
  user: userRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
