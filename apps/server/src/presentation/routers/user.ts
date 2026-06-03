import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
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
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [dbUser] = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        phone: userSchema.phone,
        socialLinks: userSchema.socialLinks,
        isProviderVisible: userSchema.isProviderVisible,
      })
      .from(userSchema)
      .where(eq(userSchema.id, ctx.session.user.id))
      .limit(1);

    if (!dbUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Usuário não encontrado',
      });
    }

    return dbUser;
  }),
  update: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(3, 'O nome deve ter pelo menos 3 caracteres')
          .max(100, 'O nome deve ter no máximo 100 caracteres')
          .optional(),
        socialLinks: z
          .object({
            whatsapp: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().optional(),
            instagram: z.string().optional(),
            tiktok: z.string().optional(),
            facebook: z.string().optional(),
            website: z.string().optional(),
          })
          .optional(),
        isProviderVisible: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await updateUserUseCase.execute({
        userId: ctx.session.user.id,
        name: input.name,
        socialLinks: input.socialLinks,
        isProviderVisible: input.isProviderVisible,
      });
    }),
});
