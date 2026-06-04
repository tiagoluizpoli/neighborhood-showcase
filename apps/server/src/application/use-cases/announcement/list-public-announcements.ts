import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { env } from '@neighborhood-showcase/env/server';
import { and, desc, eq, ilike, isNull, or, type SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const condoAddress = alias(addressSchema, 'condo_address');

export interface ListPublicAnnouncementsInput {
  latitude?: number;
  longitude?: number;
  condominiumId?: string;
  categoryId?: string;
  search?: string;
  verifiedOnly?: boolean;
  userCondoId?: string; // Selected/geolocated condominium ID for proximity sorting
  radiusKm?: number;
  city?: string;
  neighborhood?: string;
  ipCity?: string;
  ipState?: string;
}

export interface PublicAnnouncementItem {
  id: string;
  providerId: string;
  condominiumId: string | null;
  condoName: string | null;
  condoCity: string;
  condoState: string;
  condoNeighborhood?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  category: string;
  categoryId: string;
  tags: string[];
  contactLinks: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    website?: string;
  };
  showVerifiedBadge: boolean;
  status: string;
  createdAt: Date;
  providerName: string;
  providerAvatarUrl: string | null;
}

export class ListPublicAnnouncements {
  async execute(
    input: ListPublicAnnouncementsInput,
  ): Promise<PublicAnnouncementItem[]> {
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
        sql`ST_DWithin(COALESCE(${condominiumSchema.geog}, ${providerLocationSchema.geog}), ${visitorPoint}, ${radiusMeters})`,
      );
    }

    // 3. Query from Drizzle with left joins to retrieve both condominium and external addresses
    const query = db
      .select({
        announcement: announcementSchema,
        condominium: condominiumSchema,
        providerLocation: providerLocationSchema,
        providerAddress: addressSchema,
        condoAddress: condoAddress,
        provider: userSchema,
        category: categorySchema,
      })
      .from(announcementSchema)
      .innerJoin(userSchema, eq(announcementSchema.providerId, userSchema.id))
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
        providerLocationSchema,
        eq(announcementSchema.providerLocationId, providerLocationSchema.id),
      )
      .leftJoin(
        addressSchema,
        eq(providerLocationSchema.addressId, addressSchema.id),
      )
      .where(and(...conditions));

    if (hasCoordinates && visitorPoint) {
      const orderByExpressions: SQL[] = [];

      if (input.userCondoId) {
        orderByExpressions.push(
          sql`CASE WHEN ${announcementSchema.condominiumId} = ${input.userCondoId} THEN 0 ELSE 1 END`,
        );
      }

      orderByExpressions.push(
        sql`ST_Distance(COALESCE(${condominiumSchema.geog}, ${providerLocationSchema.geog}), ${visitorPoint})`,
      );

      orderByExpressions.push(desc(announcementSchema.showVerifiedBadge));

      orderByExpressions.push(desc(announcementSchema.createdAt));

      const rows = await query.orderBy(...orderByExpressions);
      return rows.map(mapRow);
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
    return rows.map(mapRow);
  }
}

function mapRow(row: {
  announcement: typeof announcementSchema.$inferSelect;
  condominium: typeof condominiumSchema.$inferSelect | null;
  providerLocation: typeof providerLocationSchema.$inferSelect | null;
  providerAddress: typeof addressSchema.$inferSelect | null;
  condoAddress?: typeof addressSchema.$inferSelect | null;
  provider: typeof userSchema.$inferSelect;
  category: typeof categorySchema.$inferSelect;
}): PublicAnnouncementItem {
  const condoCity = row.condominium?.city || row.providerAddress?.city || '';
  const condoState = row.condominium?.state || row.providerAddress?.state || '';
  const condoNeighborhood =
    row.condoAddress?.neighborhood || row.providerAddress?.neighborhood || null;
  const latitude =
    row.condominium?.latitude || row.providerLocation?.latitude || null;
  const longitude =
    row.condominium?.longitude || row.providerLocation?.longitude || null;

  return {
    id: row.announcement.id,
    providerId: row.announcement.providerId,
    condominiumId: row.announcement.condominiumId ?? null,
    condoName: row.condominium?.name ?? null,
    condoCity,
    condoState,
    condoNeighborhood,
    latitude,
    longitude,
    title: row.announcement.title,
    subtitle: row.announcement.subtitle,
    description: row.announcement.description,
    priceCents: row.announcement.priceCents,
    imageUrl: row.announcement.imageUrl,
    category: row.category.name,
    categoryId: row.announcement.categoryId,
    tags: row.announcement.tags,
    contactLinks: row.announcement.contactLinks,
    showVerifiedBadge: row.announcement.showVerifiedBadge,
    status: row.announcement.status,
    createdAt: row.announcement.createdAt,
    providerName: row.provider.name,
    providerAvatarUrl: row.provider.image || null,
  };
}
