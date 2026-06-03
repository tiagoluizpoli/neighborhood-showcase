import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement as announcementSchema,
  providerLocation as assignmentSchema,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';

export interface DismissReportsInput {
  announcementId: string;
  moderatorId: string;
}

export class DismissReports {
  async execute(input: DismissReportsInput): Promise<void> {
    const { announcementId, moderatorId } = input;

    // 1. Fetch announcement
    const [ann] = await db
      .select()
      .from(announcementSchema)
      .where(
        and(
          eq(announcementSchema.id, announcementId),
          isNull(announcementSchema.deletedAt),
        ),
      )
      .limit(1);

    if (!ann) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Anúncio não encontrado.',
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

    // 3. Verify permissions (either SYSTEM_MANAGER or approved MODERATOR of the condo)
    if (actor.role !== 'SYSTEM_MANAGER') {
      if (!ann.condominiumId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado. Este anúncio não pertence a um condomínio.',
        });
      }

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

    // 4. Delete reports
    await db
      .delete(reportSchema)
      .where(eq(reportSchema.announcementId, announcementId));
  }
}
