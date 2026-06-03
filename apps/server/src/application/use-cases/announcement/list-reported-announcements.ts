import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement as announcementSchema,
  providerLocation as assignmentSchema,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

export interface ListReportedAnnouncementsInput {
  actorId: string;
  threshold?: number;
}

export interface ReportedAnnouncementItem {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
  suspensionReason: string | null;
  createdAt: Date;
  providerId: string;
  providerName: string;
  providerEmail: string;
  totalReports: number;
  reasonBreakdown: {
    FRAUDE_GOLPE: number;
    ASSEDIO_OFENSIVO: number;
    SPAM: number;
    SERVICO_ILEGAL: number;
    OUTROS: number;
  };
  reports: Array<{
    id: string;
    reporterName: string;
    reporterEmail: string;
    reason: string;
    createdAt: Date;
  }>;
}

export class ListReportedAnnouncements {
  async execute(
    input: ListReportedAnnouncementsInput,
  ): Promise<ReportedAnnouncementItem[]> {
    const { actorId, threshold = 5 } = input;

    // 1. Fetch acting user details
    const [actor] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, actorId))
      .limit(1);

    if (!actor) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    }

    let moderatedCondoIds: string[] = [];

    if (actor.role !== 'SYSTEM_MANAGER') {
      // Fetch moderator assignments
      const assignments = await db
        .select({ condominiumId: assignmentSchema.condominiumId })
        .from(assignmentSchema)
        .where(
          and(
            eq(assignmentSchema.providerId, actorId),
            eq(assignmentSchema.type, 'MODERATOR'),
            eq(assignmentSchema.status, 'APPROVED'),
          ),
        );

      if (assignments.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado. Você não tem permissões de moderador.',
        });
      }

      moderatedCondoIds = assignments
        .map((a) => a.condominiumId)
        .filter((id): id is string => id !== null);
    }

    // 2. Query announcements meeting report threshold

    // Filter announcements by role scope
    const announcementFilter =
      actor.role === 'SYSTEM_MANAGER'
        ? isNull(announcementSchema.deletedAt)
        : and(
            isNull(announcementSchema.deletedAt),
            inArray(announcementSchema.condominiumId, moderatedCondoIds),
          );

    const spotlightedAnnouncements = await db
      .select({
        id: announcementSchema.id,
        title: announcementSchema.title,
        imageUrl: announcementSchema.imageUrl,
        status: announcementSchema.status,
        suspensionReason: announcementSchema.suspensionReason,
        createdAt: announcementSchema.createdAt,
        providerId: announcementSchema.providerId,
        providerName: userSchema.name,
        providerEmail: userSchema.email,
        reportCount:
          sql<number>`count(distinct ${reportSchema.reporterId})`.mapWith(
            Number,
          ),
      })
      .from(announcementSchema)
      .innerJoin(userSchema, eq(announcementSchema.providerId, userSchema.id))
      .innerJoin(
        reportSchema,
        eq(reportSchema.announcementId, announcementSchema.id),
      )
      .where(announcementFilter)
      .groupBy(
        announcementSchema.id,
        announcementSchema.title,
        announcementSchema.imageUrl,
        announcementSchema.status,
        announcementSchema.suspensionReason,
        announcementSchema.createdAt,
        announcementSchema.providerId,
        userSchema.name,
        userSchema.email,
      )
      .having(sql`count(distinct ${reportSchema.reporterId}) >= ${threshold}`);

    if (spotlightedAnnouncements.length === 0) {
      return [];
    }

    const targetIds = spotlightedAnnouncements.map((a) => a.id);

    // 3. Query all reports for target announcements to construct details and breakdown
    const allReports = await db
      .select({
        id: reportSchema.id,
        announcementId: reportSchema.announcementId,
        reason: reportSchema.reason,
        createdAt: reportSchema.createdAt,
        reporterName: userSchema.name,
        reporterEmail: userSchema.email,
      })
      .from(reportSchema)
      .innerJoin(userSchema, eq(reportSchema.reporterId, userSchema.id))
      .where(inArray(reportSchema.announcementId, targetIds));

    // Map output
    return spotlightedAnnouncements.map((ann) => {
      const reportsForAnn = allReports.filter(
        (r) => r.announcementId === ann.id,
      );

      const reasonBreakdown = {
        FRAUDE_GOLPE: 0,
        ASSEDIO_OFENSIVO: 0,
        SPAM: 0,
        SERVICO_ILEGAL: 0,
        OUTROS: 0,
      };

      for (const r of reportsForAnn) {
        if (r.reason in reasonBreakdown) {
          reasonBreakdown[r.reason as keyof typeof reasonBreakdown]++;
        }
      }

      return {
        id: ann.id,
        title: ann.title,
        imageUrl: ann.imageUrl,
        status: ann.status,
        suspensionReason: ann.suspensionReason,
        createdAt: ann.createdAt,
        providerId: ann.providerId,
        providerName: ann.providerName || '',
        providerEmail: ann.providerEmail || '',
        totalReports: ann.reportCount,
        reasonBreakdown,
        reports: reportsForAnn.map((r) => ({
          id: r.id,
          reporterName: r.reporterName || '',
          reporterEmail: r.reporterEmail || '',
          reason: r.reason,
          createdAt: r.createdAt,
        })),
      };
    });
  }
}
