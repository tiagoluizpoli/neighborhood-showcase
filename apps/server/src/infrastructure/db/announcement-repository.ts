import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerAssignment as providerAssignmentSchema,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import type {
  Announcement,
  AnnouncementStatus,
} from '../../domain/entities/announcement.entity';
import type {
  AnnouncementRepository,
  CreateAnnouncementRepositoryInput,
  DashboardAnnouncementDTO,
  ListPublicAnnouncementsInput,
  ListReportedAnnouncementsRepositoryInput,
  ModerationAnnouncementDTO,
  ProviderAnnouncementDTO,
  PublicAnnouncementDTO,
  ReportedAnnouncementDTO,
  UpdateAnnouncementRepositoryInput,
} from '../../domain/repositories/announcement.repository';
import {
  findPublicAnnouncementById,
  listPublicAnnouncements,
} from './announcement-repository/public';
import { AnnouncementMapper } from './mappers/announcement.mapper';

export class DrizzleAnnouncementRepository implements AnnouncementRepository {
  private readonly mapper = new AnnouncementMapper();

  async create(
    input: CreateAnnouncementRepositoryInput,
  ): Promise<Announcement> {
    const [inserted] = await db
      .insert(announcementSchema)
      .values({
        id: input.id,
        providerId: input.providerId,
        condominiumId: input.condominiumId || null,
        providerAssignmentId: input.providerAssignmentId || null,
        title: input.title,
        subtitle: input.subtitle || null,
        description: input.description,
        priceCents: input.priceCents || null,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId,
        tags: input.tags,
        contactLinks: input.contactLinks,
        showVerifiedBadge: input.showVerifiedBadge,
        flaggedForReview: false,
        status: input.status || 'DRAFT',
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create announcement');
    }

    return this.mapper.toDomain(inserted);
  }

  async findById(id: string): Promise<Announcement | null> {
    const [found] = await db
      .select()
      .from(announcementSchema)
      .where(eq(announcementSchema.id, id))
      .limit(1);

    return found ? this.mapper.toDomain(found) : null;
  }

  async updateStatus(
    id: string,
    status: AnnouncementStatus,
  ): Promise<Announcement> {
    const [updated] = await db
      .update(announcementSchema)
      .set({ status })
      .where(eq(announcementSchema.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update announcement status for ${id}`);
    }

    return this.mapper.toDomain(updated);
  }

  async update(
    id: string,
    input: UpdateAnnouncementRepositoryInput,
  ): Promise<Announcement> {
    const [updated] = await db
      .update(announcementSchema)
      .set(input)
      .where(eq(announcementSchema.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update announcement for ${id}`);
    }

    return this.mapper.toDomain(updated);
  }

  async findPublicById(id: string): Promise<PublicAnnouncementDTO | null> {
    return findPublicAnnouncementById(id);
  }

  async listForModeration(
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
        contactLinks: announcementSchema.contactLinks,
        showVerifiedBadge: announcementSchema.showVerifiedBadge,
        flaggedForReview: announcementSchema.flaggedForReview,
        status: announcementSchema.status,
        suspensionReason: announcementSchema.suspensionReason,
        createdAt: announcementSchema.createdAt,
        providerName: userSchema.name,
      })
      .from(announcementSchema)
      .innerJoin(userSchema, eq(announcementSchema.providerId, userSchema.id))
      .innerJoin(
        categorySchema,
        eq(announcementSchema.categoryId, categorySchema.id),
      )
      .where(
        and(
          eq(announcementSchema.condominiumId, condominiumId),
          inArray(announcementSchema.status, ['ACTIVE', 'SUSPENDED']),
          isNull(announcementSchema.deletedAt),
        ),
      );

    return rows.map((row) => ({
      ...row,
      contactLinks: row.contactLinks as Record<string, string | undefined>,
      providerName: row.providerName ?? '',
    }));
  }

  async listReported(
    input: ListReportedAnnouncementsRepositoryInput,
  ): Promise<ReportedAnnouncementDTO[]> {
    const announcementFilter = input.condominiumIds
      ? and(
          isNull(announcementSchema.deletedAt),
          inArray(announcementSchema.condominiumId, input.condominiumIds),
        )
      : isNull(announcementSchema.deletedAt);

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

  async suspend(id: string, reason: string): Promise<void> {
    await db
      .update(announcementSchema)
      .set({
        status: 'SUSPENDED',
        suspensionReason: reason,
        flaggedForReview: false,
      })
      .where(eq(announcementSchema.id, id));
  }

  async reinstate(id: string): Promise<void> {
    await db
      .update(announcementSchema)
      .set({
        status: 'ACTIVE',
        suspensionReason: null,
        flaggedForReview: false,
      })
      .where(eq(announcementSchema.id, id));
  }

  async softDeleteAllByProviderId(
    providerId: string,
    reason: string,
  ): Promise<void> {
    await db
      .update(announcementSchema)
      .set({
        deletedAt: new Date(),
        status: 'SUSPENDED',
        suspensionReason: reason,
      })
      .where(eq(announcementSchema.providerId, providerId));
  }

  async findActiveByProviderId(
    providerId: string,
    providerName: string,
    providerAvatarUrl: string | null,
  ): Promise<ProviderAnnouncementDTO[]> {
    const rows = await db
      .select({
        id: announcementSchema.id,
        providerId: announcementSchema.providerId,
        condominiumId: announcementSchema.condominiumId,
        title: announcementSchema.title,
        subtitle: announcementSchema.subtitle,
        description: announcementSchema.description,
        priceCents: announcementSchema.priceCents,
        imageUrl: announcementSchema.imageUrl,
        categoryId: announcementSchema.categoryId,
        category: categorySchema.name,
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
      .innerJoin(
        categorySchema,
        eq(announcementSchema.categoryId, categorySchema.id),
      )
      .leftJoin(
        condominiumSchema,
        eq(announcementSchema.condominiumId, condominiumSchema.id),
      )
      .leftJoin(
        providerAssignmentSchema,
        eq(
          announcementSchema.providerAssignmentId,
          providerAssignmentSchema.id,
        ),
      )
      .leftJoin(
        addressSchema,
        eq(providerAssignmentSchema.addressId, addressSchema.id),
      )
      .where(
        and(
          eq(announcementSchema.providerId, providerId),
          eq(announcementSchema.status, 'ACTIVE'),
          isNull(announcementSchema.deletedAt),
        ),
      );

    return rows.map((row) => ({
      id: row.id,
      providerId: row.providerId,
      condominiumId: row.condominiumId ?? null,
      title: row.title,
      subtitle: row.subtitle ?? null,
      description: row.description,
      priceCents: row.priceCents ?? null,
      imageUrl: row.imageUrl,
      categoryId: row.categoryId,
      category: row.category,
      tags: row.tags ?? [],
      contactLinks: (row.contactLinks ?? {}) as Record<
        string,
        string | undefined
      >,
      showVerifiedBadge: row.showVerifiedBadge,
      status: row.status,
      createdAt: row.createdAt,
      condoName: row.condoName ?? null,
      condoCity: row.condoCity ?? row.providerLocCity ?? '',
      condoState: row.condoState ?? row.providerLocState ?? '',
      providerName,
      providerAvatarUrl,
    }));
  }

  async findIdsByProviderId(providerId: string): Promise<string[]> {
    const rows = await db
      .select({ id: announcementSchema.id })
      .from(announcementSchema)
      .where(
        and(
          eq(announcementSchema.providerId, providerId),
          isNull(announcementSchema.deletedAt),
        ),
      );
    return rows.map((r) => r.id);
  }

  async findDashboardByProviderId(
    providerId: string,
  ): Promise<DashboardAnnouncementDTO[]> {
    const rows = await db
      .select({
        id: announcementSchema.id,
        title: announcementSchema.title,
        subtitle: announcementSchema.subtitle,
        description: announcementSchema.description,
        priceCents: announcementSchema.priceCents,
        imageUrl: announcementSchema.imageUrl,
        categoryId: announcementSchema.categoryId,
        categoryName: categorySchema.name,
        tags: announcementSchema.tags,
        contactLinks: announcementSchema.contactLinks,
        showVerifiedBadge: announcementSchema.showVerifiedBadge,
        flaggedForReview: announcementSchema.flaggedForReview,
        status: announcementSchema.status,
        paidAt: announcementSchema.paidAt,
        expiresAt: announcementSchema.expiresAt,
        createdAt: announcementSchema.createdAt,
        suspensionReason: announcementSchema.suspensionReason,
        condoName: condominiumSchema.name,
        providerAssignmentId: announcementSchema.providerAssignmentId,
      })
      .from(announcementSchema)
      .leftJoin(
        condominiumSchema,
        eq(announcementSchema.condominiumId, condominiumSchema.id),
      )
      .innerJoin(
        categorySchema,
        eq(announcementSchema.categoryId, categorySchema.id),
      )
      .where(
        and(
          eq(announcementSchema.providerId, providerId),
          isNull(announcementSchema.deletedAt),
        ),
      );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? null,
      description: row.description,
      priceCents: row.priceCents ?? null,
      imageUrl: row.imageUrl,
      category: row.categoryName,
      categoryId: row.categoryId,
      tags: row.tags ?? [],
      contactLinks: (row.contactLinks ?? {}) as Record<
        string,
        string | undefined
      >,
      showVerifiedBadge: row.showVerifiedBadge,
      flaggedForReview: row.flaggedForReview,
      status: row.status,
      paidAt: row.paidAt ?? null,
      expiresAt: row.expiresAt ?? null,
      createdAt: row.createdAt,
      suspensionReason: row.suspensionReason ?? null,
      condoName: row.condoName || '',
      providerAssignmentId: row.providerAssignmentId ?? null,
    }));
  }

  async findPublic(
    input: ListPublicAnnouncementsInput,
  ): Promise<PublicAnnouncementDTO[]> {
    return listPublicAnnouncements(input);
  }
}
