import { DeleteUserAccount } from '../../application/use-cases/user/delete-user-account';
import { protectedProcedure, router } from '../trpc';

const deleteUserAccountUseCase = new DeleteUserAccount();

export const userRouter = router({
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteUserAccountUseCase.execute({ userId: ctx.session.user.id });
    return { success: true };
  }),
});
