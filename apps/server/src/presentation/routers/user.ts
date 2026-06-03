import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  assignment as assignmentSchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { DeleteUserAccount } from '../../application/use-cases/user/delete-user-account';
import { UpdateUser } from '../../application/use-cases/user/update-user';
import { protectedProcedure, publicProcedure, router } from '../trpc';

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
  getPublicProfile: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const [dbUser] = await db
        .select({
          id: userSchema.id,
          name: userSchema.name,
          image: userSchema.image,
          socialLinks: userSchema.socialLinks,
          status: userSchema.status,
          deletedAt: userSchema.deletedAt,
        })
        .from(userSchema)
        .where(eq(userSchema.id, input.id))
        .limit(1);

      if (!dbUser || dbUser.status === 'BANNED' || dbUser.deletedAt !== null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prestador não encontrado',
        });
      }

      const approvedAssignments = await db
        .select()
        .from(assignmentSchema)
        .where(
          and(
            eq(assignmentSchema.providerId, dbUser.id),
            eq(assignmentSchema.type, 'RESIDENT'),
            eq(assignmentSchema.status, 'APPROVED'),
          ),
        )
        .limit(1);
      const isVerified = approvedAssignments.length > 0;

      const ads = await db
        .select({
          id: announcementSchema.id,
          providerId: announcementSchema.providerId,
          condominiumId: announcementSchema.condominiumId,
          title: announcementSchema.title,
          subtitle: announcementSchema.subtitle,
          description: announcementSchema.description,
          priceCents: announcementSchema.priceCents,
          imageUrl: announcementSchema.imageUrl,
          category: announcementSchema.category,
          tags: announcementSchema.tags,
          contactLinks: announcementSchema.contactLinks,
          showVerifiedBadge: announcementSchema.showVerifiedBadge,
          status: announcementSchema.status,
          createdAt: announcementSchema.createdAt,
          condoName: condominiumSchema.name,
          condoCity: condominiumSchema.city,
          condoState: condominiumSchema.state,
          providerLocCity: addressSchema.city,
          providerLocState: addressSchema.state,
        })
        .from(announcementSchema)
        .leftJoin(
          condominiumSchema,
          eq(announcementSchema.condominiumId, condominiumSchema.id),
        )
        .leftJoin(
          providerLocationSchema,
          eq(announcementSchema.providerLocationId, providerLocationSchema.id),
        )
        .leftJoin(
          addressSchema,
          eq(providerLocationSchema.addressId, addressSchema.id),
        )
        .where(
          and(
            eq(announcementSchema.providerId, dbUser.id),
            eq(announcementSchema.status, 'ACTIVE'),
            isNull(announcementSchema.deletedAt),
          ),
        );

      const mappedAnnouncements = ads.map((ad) => {
        const condoCity = ad.condoCity || ad.providerLocCity || '';
        const condoState = ad.condoState || ad.providerLocState || '';
        return {
          id: ad.id,
          providerId: ad.providerId,
          condominiumId: ad.condominiumId,
          title: ad.title,
          subtitle: ad.subtitle,
          description: ad.description,
          priceCents: ad.priceCents,
          imageUrl: ad.imageUrl,
          category: ad.category,
          tags: ad.tags,
          contactLinks: ad.contactLinks,
          showVerifiedBadge: ad.showVerifiedBadge,
          status: ad.status,
          createdAt: ad.createdAt,
          condoName: ad.condoName,
          condoCity,
          condoState,
          providerName: dbUser.name,
          providerAvatarUrl: dbUser.image || null,
        };
      });

      return {
        provider: {
          id: dbUser.id,
          name: dbUser.name,
          avatarUrl: dbUser.image || null,
          socialLinks: dbUser.socialLinks,
          isVerified,
        },
        announcements: mappedAnnouncements,
      };
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
