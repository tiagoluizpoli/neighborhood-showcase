import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement as announcementSchema,
  providerLocation as assignmentSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';

export interface SuspendAnnouncementInput {
  announcementId: string;
  moderatorId: string;
  reason: string;
}

export class SuspendAnnouncement {
  async execute(input: SuspendAnnouncementInput): Promise<void> {
    const { announcementId, moderatorId, reason } = input;

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

    // 2. Fetch acting user details to check for global SYSTEM_MANAGER role
    const [actor] = await db
      .select({ role: userSchema.role })
      .from(userSchema)
      .where(eq(userSchema.id, moderatorId))
      .limit(1);

    if (!actor) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    }

    if (actor.role !== 'SYSTEM_MANAGER') {
      // Verify moderator permission for the announcement's condominium
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
    }

    // 3. Update announcement to SUSPENDED with reason
    await db
      .update(announcementSchema)
      .set({
        status: 'SUSPENDED',
        suspensionReason: reason,
        flaggedForReview: false,
      })
      .where(eq(announcementSchema.id, announcementId));
  }
}
