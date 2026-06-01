import { db } from '@neighborhood-showcase/db';
import {
  announcement as announcementSchema,
  providerLocation as assignmentSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';

export interface ReinstateAnnouncementInput {
  announcementId: string;
  moderatorId: string;
}

export class ReinstateAnnouncement {
  async execute(input: ReinstateAnnouncementInput): Promise<void> {
    const { announcementId, moderatorId } = input;

    // 1. Fetch announcement
    const [ann] = await db
      .select()
      .from(announcementSchema)
      .where(eq(announcementSchema.id, announcementId))
      .limit(1);

    if (!ann) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Anúncio não encontrado.',
      });
    }

    if (!ann.condominiumId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Anúncio não está associado a um condomínio.',
      });
    }

    // 2. Verify moderator permission for the announcement's condominium
    const [isMod] = await db
      .select()
      .from(assignmentSchema)
      .where(
        and(
          eq(assignmentSchema.providerId, moderatorId),
          eq(assignmentSchema.condominiumId, ann.condominiumId),
          eq(assignmentSchema.type, 'MODERATOR'),
          eq(assignmentSchema.status, 'APPROVED'),
        ),
      )
      .limit(1);

    if (!isMod) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Acesso negado. Você não é moderador deste condomínio.',
      });
    }

    // 3. Update announcement to ACTIVE and clear reason/flag
    await db
      .update(announcementSchema)
      .set({
        status: 'ACTIVE',
        suspensionReason: null,
        flaggedForReview: false,
      })
      .where(eq(announcementSchema.id, announcementId));
  }
}
