import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerAssignment as providerAssignmentSchema,
  providerProfile as providerProfileSchema,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { env } from '@neighborhood-showcase/env/server';
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
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
import { AnnouncementMapper } from './mappers/announcement.mapper';

const condoAddress = alias(addressSchema, 'condo_address');

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
    const [found] = await db
      .select()
      .from(announcementSchema)
      .where(eq(announcementSchema.id, id))
      .limit(1);

    if (!found || found.status !== 'ACTIVE' || found.deletedAt !== null) {
      return null;
    }

    let condoName = '';
    let condoCity = '';
    let condoState = '';

    if (found.condominiumId) {
      const [condo] = await db
        .select()
        .from(condominiumSchema)
        .where(eq(condominiumSchema.id, found.condominiumId))
        .limit(1);
      if (condo) {
        condoName = condo.name;
        condoCity = condo.city;
        condoState = condo.state;
      }
    } else if (found.providerAssignmentId) {
      const [loc] = await db
        .select({ city: addressSchema.city, state: addressSchema.state })
        .from(providerAssignmentSchema)
        .innerJoin(
          addressSchema,
          eq(providerAssignmentSchema.addressId, addressSchema.id),
        )
        .where(eq(providerAssignmentSchema.id, found.providerAssignmentId))
        .limit(1);
      if (loc) {
        condoCity = loc.city;
        condoState = loc.state;
      }
    }

    const [provider] = await db
      .select({
        name: userSchema.name,
        image: userSchema.image,
        profileName: providerProfileSchema.displayName,
        profileAvatarUrl: providerProfileSchema.avatarUrl,
      })
      .from(userSchema)
      .leftJoin(
        providerProfileSchema,
        eq(providerProfileSchema.providerId, userSchema.id),
      )
      .where(eq(userSchema.id, found.providerId))
      .limit(1);

    const [cat] = await db
      .select({ name: categorySchema.name })
      .from(categorySchema)
      .where(eq(categorySchema.id, found.categoryId))
      .limit(1);

    return {
      id: found.id,
      providerId: found.providerId,
      condominiumId: found.condominiumId,
      providerAssignmentId: found.providerAssignmentId,
      title: found.title,
      subtitle: found.subtitle,
      description: found.description,
      priceCents: found.priceCents,
      imageUrl: found.imageUrl,
      categoryId: found.categoryId,
      tags: found.tags,
      contactLinks: found.contactLinks as Record<string, string | undefined>,
      showVerifiedBadge: found.showVerifiedBadge,
      status: found.status,
      createdAt: found.createdAt,
      category: cat?.name ?? '',
      condoName,
      condoCity,
      condoState,
      providerName: provider?.profileName ?? provider?.name ?? '',
      providerAvatarUrl: provider?.profileAvatarUrl ?? provider?.image ?? null,
    };
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
    const hasCoordinates =
      typeof input.latitude === 'number' && typeof input.longitude === 'number';

    // 1. Fetch user's geolocated or selected condo info
    let userCity = '';
    let userState = '';
    const targetCondoId = input.userCondoId || '';

    if (targetCondoId) {
      const condo = await db
        .select()
        .from(condominiumSchema)
        .where(eq(condominiumSchema.id, targetCondoId))
        .limit(1)
        .then((res) => res[0]);
      if (condo) {
        userCity = condo.city;
        userState = condo.state;
      }
    }

    // 2. Build filters
    const conditions: SQL[] = [
      eq(announcementSchema.status, 'ACTIVE'),
      isNull(announcementSchema.deletedAt),
    ];

    if (input.condominiumId) {
      conditions.push(
        eq(announcementSchema.condominiumId, input.condominiumId),
      );
    }

    if (input.categoryId && input.categoryId !== 'Todos') {
      conditions.push(eq(announcementSchema.categoryId, input.categoryId));
    }

    if (input.verifiedOnly) {
      conditions.push(eq(announcementSchema.showVerifiedBadge, true));
    }

    if (input.search) {
      const searchPattern = `%${input.search}%`;
      conditions.push(
        or(
          ilike(announcementSchema.title, searchPattern),
          ilike(announcementSchema.subtitle, searchPattern) as SQL,
          ilike(announcementSchema.description, searchPattern),
        ) as SQL,
      );
    }

    if (input.city) {
      const cityPattern = `%${input.city}%`;
      conditions.push(
        or(
          ilike(condominiumSchema.city, cityPattern),
          ilike(addressSchema.city, cityPattern),
          ilike(condoAddress.city, cityPattern),
        ) as SQL,
      );
    }

    if (input.neighborhood) {
      const neighborhoodPattern = `%${input.neighborhood}%`;
      conditions.push(
        or(
          ilike(condoAddress.neighborhood, neighborhoodPattern),
          ilike(addressSchema.neighborhood, neighborhoodPattern),
        ) as SQL,
      );
    }

    let visitorPoint: SQL | null = null;
    if (hasCoordinates) {
      visitorPoint = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;
      const radiusKm = input.radiusKm ?? env.FEED_RADIUS_KM;
      const radiusMeters = radiusKm * 1000;
      conditions.push(
        sql`ST_DWithin(COALESCE(${condominiumSchema.geog}, ${providerAssignmentSchema.geog}), ${visitorPoint}, ${radiusMeters})`,
      );
    }

    // 3. Query from Drizzle with left joins to retrieve both condominium and external addresses
    const query = db
      .select({
        announcement: announcementSchema,
        condominium: condominiumSchema,
        providerAssignment: providerAssignmentSchema,
        providerAddress: addressSchema,
        condoAddress: condoAddress,
        provider: userSchema,
        providerProfile: providerProfileSchema,
        category: categorySchema,
      })
      .from(announcementSchema)
      .innerJoin(userSchema, eq(announcementSchema.providerId, userSchema.id))
      .leftJoin(
        providerProfileSchema,
        eq(providerProfileSchema.providerId, userSchema.id),
      )
      .innerJoin(
        categorySchema,
        eq(announcementSchema.categoryId, categorySchema.id),
      )
      .leftJoin(
        condominiumSchema,
        eq(announcementSchema.condominiumId, condominiumSchema.id),
      )
      .leftJoin(condoAddress, eq(condominiumSchema.addressId, condoAddress.id))
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
      .where(and(...conditions));

    const mapper = (row: {
      announcement: typeof announcementSchema.$inferSelect;
      condominium: typeof condominiumSchema.$inferSelect | null;
      providerAssignment: typeof providerAssignmentSchema.$inferSelect | null;
      providerAddress: typeof addressSchema.$inferSelect | null;
      condoAddress: typeof addressSchema.$inferSelect | null;
      provider: typeof userSchema.$inferSelect;
      providerProfile: typeof providerProfileSchema.$inferSelect | null;
      category: typeof categorySchema.$inferSelect;
    }): PublicAnnouncementDTO => {
      const condoCity =
        row.condominium?.city || row.providerAddress?.city || '';
      const condoState =
        row.condominium?.state || row.providerAddress?.state || '';
      const condoNeighborhood =
        row.condoAddress?.neighborhood ||
        row.providerAddress?.neighborhood ||
        null;
      const latitude =
        row.condominium?.latitude || row.providerAssignment?.latitude || null;
      const longitude =
        row.condominium?.longitude || row.providerAssignment?.longitude || null;

      return {
        id: row.announcement.id,
        providerId: row.announcement.providerId,
        condominiumId: row.announcement.condominiumId ?? null,
        providerAssignmentId: row.announcement.providerAssignmentId ?? null,
        title: row.announcement.title,
        subtitle: row.announcement.subtitle,
        description: row.announcement.description,
        priceCents: row.announcement.priceCents,
        imageUrl: row.announcement.imageUrl,
        categoryId: row.announcement.categoryId,
        tags: row.announcement.tags ?? [],
        contactLinks: row.announcement.contactLinks as Record<
          string,
          string | undefined
        >,
        showVerifiedBadge: row.announcement.showVerifiedBadge,
        status: row.announcement.status,
        createdAt: row.announcement.createdAt,
        category: row.category.name,
        condoName: row.condominium?.name ?? null,
        condoCity,
        condoState,
        condoNeighborhood,
        latitude,
        longitude,
        providerName: row.providerProfile?.displayName ?? row.provider.name,
        providerAvatarUrl:
          row.providerProfile?.avatarUrl ?? row.provider.image ?? null,
      };
    };

    if (hasCoordinates && visitorPoint) {
      const orderByExpressions: SQL[] = [];

      if (input.userCondoId) {
        orderByExpressions.push(
          sql`CASE WHEN ${announcementSchema.condominiumId} = ${input.userCondoId} THEN 0 ELSE 1 END`,
        );
      }

      orderByExpressions.push(
        sql`ST_Distance(COALESCE(${condominiumSchema.geog}, ${providerAssignmentSchema.geog}), ${visitorPoint})`,
      );

      orderByExpressions.push(desc(announcementSchema.showVerifiedBadge));

      orderByExpressions.push(desc(announcementSchema.createdAt));

      const rows = await query.orderBy(...orderByExpressions);
      return rows.map(mapper);
    }

    const rows = await query;

    // 4. Sort results by proximity in-memory
    rows.sort((a, b) => {
      // Priority 1: Exact condominium match
      if (targetCondoId) {
        const aExact = a.announcement.condominiumId === targetCondoId;
        const bExact = b.announcement.condominiumId === targetCondoId;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
      }

      // Resolve city and state for comparison
      const aCity = a.condominium?.city || a.providerAddress?.city || '';
      const aState = a.condominium?.state || a.providerAddress?.state || '';
      const bCity = b.condominium?.city || b.providerAddress?.city || '';
      const bState = b.condominium?.state || b.providerAddress?.state || '';

      // Priority 2: City & State match
      if (userCity && userState) {
        const aCityMatch =
          aCity.toLowerCase() === userCity.toLowerCase() &&
          aState.toLowerCase() === userState.toLowerCase();
        const bCityMatch =
          bCity.toLowerCase() === userCity.toLowerCase() &&
          bState.toLowerCase() === userState.toLowerCase();
        if (aCityMatch && !bCityMatch) return -1;
        if (!aCityMatch && bCityMatch) return 1;
      }

      // Priority 3: IP approximate region match (transparent, coarse relevance)
      if (input.ipCity && input.ipState) {
        const aIpMatch =
          aCity.toLowerCase() === input.ipCity.toLowerCase() &&
          aState.toLowerCase() === input.ipState.toLowerCase();
        const bIpMatch =
          bCity.toLowerCase() === input.ipCity.toLowerCase() &&
          bState.toLowerCase() === input.ipState.toLowerCase();
        if (aIpMatch && !bIpMatch) return -1;
        if (!aIpMatch && bIpMatch) return 1;
      }

      // Priority 4: Verified providers rank higher than unverified
      const aVerified = a.announcement.showVerifiedBadge;
      const bVerified = b.announcement.showVerifiedBadge;
      if (aVerified && !bVerified) return -1;
      if (!aVerified && bVerified) return 1;

      // Priority 5: Newest first
      return (
        b.announcement.createdAt.getTime() - a.announcement.createdAt.getTime()
      );
    });

    // 5. Map rows to output structure
    return rows.map(mapper);
  }
}
