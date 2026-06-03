import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import {
  announcement as announcementSchema,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';

export interface ReportAnnouncementInput {
  reporterId: string;
  announcementId: string;
  reason:
    | 'FRAUDE_GOLPE'
    | 'ASSEDIO_OFENSIVO'
    | 'SPAM'
    | 'SERVICO_ILEGAL'
    | 'OUTROS';
}

export class ReportAnnouncement {
  async execute(input: ReportAnnouncementInput): Promise<void> {
    const { reporterId, announcementId, reason } = input;

    // 1. Verify that the announcement exists and is not deleted
    const [ann] = await db
      .select({ id: announcementSchema.id })
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

    // 2. Verify if this user has already reported this announcement
    const [existingReport] = await db
      .select({ id: reportSchema.id })
      .from(reportSchema)
      .where(
        and(
          eq(reportSchema.reporterId, reporterId),
          eq(reportSchema.announcementId, announcementId),
        ),
      )
      .limit(1);

    if (existingReport) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Você já denunciou este anúncio.',
      });
    }

    // 3. Insert report
    const id = crypto.randomUUID();
    await db.insert(reportSchema).values({
      id,
      reporterId,
      announcementId,
      reason,
    });
  }
}
