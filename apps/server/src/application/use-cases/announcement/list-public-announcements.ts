import { db } from '@neighborhood-showcase/db';
import {
  address as addressSchema,
  announcement as announcementSchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, desc, eq, ilike, isNull, or, type SQL, sql } from 'drizzle-orm';

export interface ListPublicAnnouncementsInput {
  latitude?: number;
  longitude?: number;
  condominiumId?: string;
  category?: string;
  search?: string;
  verifiedOnly?: boolean;
  userCondoId?: string; // Selected/geolocated condominium ID for proximity sorting
}

export interface PublicAnnouncementItem {
  id: string;
  providerId: string;
  condominiumId: string | null;
  condoName: string | null;
  condoCity: string;
  condoState: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  category: string;
  tags: string[];
  contactLinks: {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
  showVerifiedBadge: boolean;
  status: string;
  createdAt: Date;
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

    if (input.category && input.category !== 'Todos') {
      conditions.push(eq(announcementSchema.category, input.category));
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

    // 3. Query from Drizzle with left joins to retrieve both condominium and external addresses
    const query = db
      .select({
        announcement: announcementSchema,
        condominium: condominiumSchema,
        providerLocation: providerLocationSchema,
        providerAddress: addressSchema,
      })
      .from(announcementSchema)
      .leftJoin(
        condominiumSchema,
        eq(announcementSchema.condominiumId, condominiumSchema.id),
      )
      .leftJoin(
        providerLocationSchema,
        eq(announcementSchema.providerLocationId, providerLocationSchema.id),
      )
      .leftJoin(
        addressSchema,
        eq(providerLocationSchema.addressId, addressSchema.id),
      )
      .where(and(...conditions));

    if (hasCoordinates) {
      const visitorPoint = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;
      const rows = await query.orderBy(
        sql`ST_Distance(COALESCE(${condominiumSchema.geog}, ${providerLocationSchema.geog}), ${visitorPoint})`,
        desc(announcementSchema.createdAt),
      );
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

      // Priority 3: Newest first
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
}): PublicAnnouncementItem {
  const condoCity = row.condominium?.city || row.providerAddress?.city || '';
  const condoState = row.condominium?.state || row.providerAddress?.state || '';

  return {
    id: row.announcement.id,
    providerId: row.announcement.providerId,
    condominiumId: row.announcement.condominiumId ?? null,
    condoName: row.condominium?.name ?? null,
    condoCity,
    condoState,
    title: row.announcement.title,
    subtitle: row.announcement.subtitle,
    description: row.announcement.description,
    priceCents: row.announcement.priceCents,
    imageUrl: row.announcement.imageUrl,
    category: row.announcement.category,
    tags: row.announcement.tags,
    contactLinks: row.announcement.contactLinks,
    showVerifiedBadge: row.announcement.showVerifiedBadge,
    status: row.announcement.status,
    createdAt: row.announcement.createdAt,
  };
}
