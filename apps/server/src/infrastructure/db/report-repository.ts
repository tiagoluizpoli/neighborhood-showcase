import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import { report as reportSchema } from '@neighborhood-showcase/db/schema/showcase';
import { and, eq } from 'drizzle-orm';
import type {
  CreateReportRepositoryInput,
  ReportRecord,
  ReportRepository,
} from '../../domain/repositories/report.repository';

export class DrizzleReportRepository implements ReportRepository {
  async findByReporterAndAnnouncement(
    reporterId: string,
    announcementId: string,
  ): Promise<ReportRecord | null> {
    const [report] = await db
      .select()
      .from(reportSchema)
      .where(
        and(
          eq(reportSchema.reporterId, reporterId),
          eq(reportSchema.announcementId, announcementId),
        ),
      )
      .limit(1);

    return report ?? null;
  }

  async create(input: CreateReportRepositoryInput): Promise<ReportRecord> {
    const [report] = await db
      .insert(reportSchema)
      .values({
        id: crypto.randomUUID(),
        reporterId: input.reporterId,
        announcementId: input.announcementId,
        reason: input.reason,
      })
      .returning();

    if (!report) {
      throw new Error('Failed to create report');
    }

    return report;
  }

  async deleteByAnnouncementId(announcementId: string): Promise<void> {
    await db
      .delete(reportSchema)
      .where(eq(reportSchema.announcementId, announcementId));
  }
}
