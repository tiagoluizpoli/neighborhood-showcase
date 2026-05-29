import { protectedProcedure, router } from '../trpc';
import { DeleteUserAccount } from '../../application/use-cases/user/delete-user-account';

const deleteUserAccountUseCase = new DeleteUserAccount();

export const userRouter = router({
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteUserAccountUseCase.execute({ userId: ctx.session.user.id });
    return { success: true };
  }),
});
