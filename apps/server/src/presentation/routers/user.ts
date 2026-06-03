import { z } from 'zod';
import { DeleteUserAccount } from '../../application/use-cases/user/delete-user-account';
import { UpdateUser } from '../../application/use-cases/user/update-user';
import { protectedProcedure, router } from '../trpc';

const deleteUserAccountUseCase = new DeleteUserAccount();
const updateUserUseCase = new UpdateUser();

export const userRouter = router({
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteUserAccountUseCase.execute({ userId: ctx.session.user.id });
    return { success: true };
  }),
  updateName: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(3, 'O nome deve ter pelo menos 3 caracteres')
          .max(100, 'O nome deve ter no máximo 100 caracteres'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await updateUserUseCase.execute({
        userId: ctx.session.user.id,
        name: input.name,
      });
    }),
});
