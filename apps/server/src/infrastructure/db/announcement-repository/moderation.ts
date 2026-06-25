import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement as announcementSchema,
  category as categorySchema,
  provider as providerSchema,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import type {
  ListReportedAnnouncementsRepositoryInput,
  ModerationAnnouncementDTO,
  ReportedAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';
import {
  contactSettingsToLinks,
  rowToContactSettings,
} from '../mappers/announcement-contact';

export async function listAnnouncementsForModeration(
  condominiumId: string,
): Promise<ModerationAnnouncementDTO[]> {
  const rows = await db
    .select({
      id: announcementSchema.id,
      title: announcementSchema.title,
      subtitle: announcementSchema.subtitle,
      description: announcementSchema.description,
      priceCents: announcementSchema.priceCents,
      imageUrl: announcementSchema.imageUrl,
      category: categorySchema.name,
      categoryId: announcementSchema.categoryId,
      tags: announcementSchema.tags,
      contactMode: announcementSchema.contactMode,
      contactCustom: announcementSchema.contactCustom,
      showVerifiedBadge: announcementSchema.showVerifiedBadge,
      flaggedForReview: announcementSchema.flaggedForReview,
      status: announcementSchema.status,
      suspensionReason: announcementSchema.suspensionReason,
      createdAt: announcementSchema.createdAt,
      providerName: userSchema.name,
    })
    .from(announcementSchema)
    .innerJoin(
      providerSchema,
      eq(announcementSchema.providerId, providerSchema.id),
    )
    .innerJoin(userSchema, eq(providerSchema.ownerId, userSchema.id))
    .innerJoin(
      categorySchema,
      eq(announcementSchema.categoryId, categorySchema.id),
    )
    .where(
      and(
        eq(announcementSchema.condominiumId, condominiumId),
        inArray(announcementSchema.status, ['ACTIVE', 'SUSPENDED']),
        isNull(announcementSchema.deletedAt),
        // Exclude announcements belonging to a soft-deleted provider.
        isNull(providerSchema.deletedAt),
      ),
    );

  return rows.map((row) => {
    const { contactMode, contactCustom, ...rest } = row;
    const contact = rowToContactSettings({
      mode: contactMode,
      custom: contactCustom ?? null,
    });
    return {
      ...rest,
      contact,
      contactLinks: contactSettingsToLinks(contact),
      providerName: row.providerName ?? '',
    };
  });
}

export async function listReportedAnnouncements(
  input: ListReportedAnnouncementsRepositoryInput,
): Promise<ReportedAnnouncementDTO[]> {
  // Exclude announcements whose provider is soft-deleted (provider is
  // inner-joined below), alongside soft-deleted announcement rows.
  const announcementFilter = input.condominiumIds
    ? and(
        isNull(announcementSchema.deletedAt),
        isNull(providerSchema.deletedAt),
        inArray(announcementSchema.condominiumId, input.condominiumIds),
      )
    : and(
        isNull(announcementSchema.deletedAt),
        isNull(providerSchema.deletedAt),
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
        sql<number>`count(distinct ${reportSchema.reporterId})`.mapWith(Number),
    })
    .from(announcementSchema)
    .innerJoin(
      providerSchema,
      eq(announcementSchema.providerId, providerSchema.id),
    )
    .innerJoin(userSchema, eq(providerSchema.ownerId, userSchema.id))
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
    .having(
      sql`count(distinct ${reportSchema.reporterId}) >= ${input.threshold}`,
    );

  if (spotlightedAnnouncements.length === 0) {
    return [];
  }

  const targetIds = spotlightedAnnouncements.map((item) => item.id);
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

  return spotlightedAnnouncements.map((announcement) => {
    const reports = allReports.filter(
      (report) => report.announcementId === announcement.id,
    );
    const reasonBreakdown = {
      FRAUDE_GOLPE: 0,
      ASSEDIO_OFENSIVO: 0,
      SPAM: 0,
      SERVICO_ILEGAL: 0,
      OUTROS: 0,
    };

    for (const report of reports) {
      if (report.reason in reasonBreakdown) {
        reasonBreakdown[report.reason as keyof typeof reasonBreakdown] += 1;
      }
    }

    return {
      id: announcement.id,
      title: announcement.title,
      imageUrl: announcement.imageUrl,
      status: announcement.status,
      suspensionReason: announcement.suspensionReason,
      createdAt: announcement.createdAt,
      providerId: announcement.providerId,
      providerName: announcement.providerName ?? '',
      providerEmail: announcement.providerEmail ?? '',
      totalReports: announcement.reportCount,
      reasonBreakdown,
      reports: reports.map((report) => ({
        id: report.id,
        reporterName: report.reporterName ?? '',
        reporterEmail: report.reporterEmail ?? '',
        reason: report.reason,
        createdAt: report.createdAt,
      })),
    };
  });
}

export async function suspendAnnouncement(
  id: string,
  reason: string,
): Promise<void> {
  await db
    .update(announcementSchema)
    .set({
      status: 'SUSPENDED',
      suspensionReason: reason,
      flaggedForReview: false,
    })
    .where(eq(announcementSchema.id, id));
}

export async function reinstateAnnouncement(id: string): Promise<void> {
  await db
    .update(announcementSchema)
    .set({
      status: 'ACTIVE',
      suspensionReason: null,
      flaggedForReview: false,
    })
    .where(eq(announcementSchema.id, id));
}

export async function countPendingAnnouncementsByCondo(
  condominiumId: string,
): Promise<number> {
  const result = await db.query.announcement.findMany({
    columns: { id: true },
    where: and(
      eq(announcementSchema.condominiumId, condominiumId),
      eq(announcementSchema.flaggedForReview, true),
      isNull(announcementSchema.deletedAt),
    ),
  });
  return result.length;
}
