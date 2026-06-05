import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerAssignment as providerAssignmentSchema,
  providerProfile as providerProfileSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { env } from '@neighborhood-showcase/env/server';
import { and, desc, eq, ilike, isNull, or, type SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type {
  ListPublicAnnouncementsInput,
  PublicAnnouncementDTO,
} from '../../../../domain/repositories/announcement.repository';

const condoAddress = alias(addressSchema, 'condo_address');

export async function listPublicAnnouncements(
  input: ListPublicAnnouncementsInput,
): Promise<PublicAnnouncementDTO[]> {
  const hasCoordinates =
    typeof input.latitude === 'number' && typeof input.longitude === 'number';

  let userCity = '';
  let userState = '';
  const targetCondoId = input.userCondoId || '';

  if (targetCondoId) {
    const condo = await db
      .select()
      .from(condominiumSchema)
      .where(eq(condominiumSchema.id, targetCondoId))
      .limit(1)
      .then((rows) => rows[0]);
    if (condo) {
      userCity = condo.city;
      userState = condo.state;
    }
  }

  const conditions: SQL[] = [
    eq(announcementSchema.status, 'ACTIVE'),
    isNull(announcementSchema.deletedAt),
  ];

  if (input.condominiumId) {
    conditions.push(eq(announcementSchema.condominiumId, input.condominiumId));
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
      eq(announcementSchema.providerAssignmentId, providerAssignmentSchema.id),
    )
    .leftJoin(
      addressSchema,
      eq(providerAssignmentSchema.addressId, addressSchema.id),
    )
    .where(and(...conditions));

  const mapRow = (row: {
    announcement: typeof announcementSchema.$inferSelect;
    condominium: typeof condominiumSchema.$inferSelect | null;
    providerAssignment: typeof providerAssignmentSchema.$inferSelect | null;
    providerAddress: typeof addressSchema.$inferSelect | null;
    condoAddress: typeof addressSchema.$inferSelect | null;
    provider: typeof userSchema.$inferSelect;
    providerProfile: typeof providerProfileSchema.$inferSelect | null;
    category: typeof categorySchema.$inferSelect;
  }): PublicAnnouncementDTO => {
    const condoCity = row.condominium?.city || row.providerAddress?.city || '';
    const condoState =
      row.condominium?.state || row.providerAddress?.state || '';

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
      condoNeighborhood:
        row.condoAddress?.neighborhood ||
        row.providerAddress?.neighborhood ||
        null,
      latitude:
        row.condominium?.latitude || row.providerAssignment?.latitude || null,
      longitude:
        row.condominium?.longitude || row.providerAssignment?.longitude || null,
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
    return rows.map(mapRow);
  }

  const rows = await query;

  rows.sort((a, b) => {
    if (targetCondoId) {
      const aExact = a.announcement.condominiumId === targetCondoId;
      const bExact = b.announcement.condominiumId === targetCondoId;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
    }

    const aCity = a.condominium?.city || a.providerAddress?.city || '';
    const aState = a.condominium?.state || a.providerAddress?.state || '';
    const bCity = b.condominium?.city || b.providerAddress?.city || '';
    const bState = b.condominium?.state || b.providerAddress?.state || '';

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

    const aVerified = a.announcement.showVerifiedBadge;
    const bVerified = b.announcement.showVerifiedBadge;
    if (aVerified && !bVerified) return -1;
    if (!aVerified && bVerified) return 1;

    return (
      b.announcement.createdAt.getTime() - a.announcement.createdAt.getTime()
    );
  });

  return rows.map(mapRow);
}
