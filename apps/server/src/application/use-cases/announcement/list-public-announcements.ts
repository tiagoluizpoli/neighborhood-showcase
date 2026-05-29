import { db } from '@base-fullstack-template/db';
import {
  announcement as announcementSchema,
  condominium as condominiumSchema,
} from '@base-fullstack-template/db/schema/showcase';
import { and, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';

export interface ListPublicAnnouncementsInput {
  condominiumId?: string;
  category?: string;
  search?: string;
  verifiedOnly?: boolean;
  userCondoId?: string; // Selected/geolocated condominium ID for proximity sorting
}

export interface PublicAnnouncementItem {
  id: string;
  providerId: string;
  condominiumId: string;
  condoName: string;
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
          ilike(announcementSchema.subtitle, searchPattern),
          ilike(announcementSchema.description, searchPattern),
        ),
      );
    }

    // 3. Query from Drizzle with join
    const rows = await db
      .select({
        announcement: announcementSchema,
        condominium: condominiumSchema,
      })
      .from(announcementSchema)
      .innerJoin(
        condominiumSchema,
        eq(announcementSchema.condominiumId, condominiumSchema.id),
      )
      .where(and(...conditions));

    // 4. Sort results by proximity in-memory
    rows.sort((a, b) => {
      // Priority 1: Exact condominium match
      if (targetCondoId) {
        const aExact = a.announcement.condominiumId === targetCondoId;
        const bExact = b.announcement.condominiumId === targetCondoId;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
      }

      // Priority 2: City & State match
      if (userCity && userState) {
        const aCityMatch =
          a.condominium.city.toLowerCase() === userCity.toLowerCase() &&
          a.condominium.state.toLowerCase() === userState.toLowerCase();
        const bCityMatch =
          b.condominium.city.toLowerCase() === userCity.toLowerCase() &&
          b.condominium.state.toLowerCase() === userState.toLowerCase();
        if (aCityMatch && !bCityMatch) return -1;
        if (!aCityMatch && bCityMatch) return 1;
      }

      // Priority 3: Newest first
      return (
        b.announcement.createdAt.getTime() - a.announcement.createdAt.getTime()
      );
    });

    // 5. Map rows to output structure
    return rows.map((row) => ({
      id: row.announcement.id,
      providerId: row.announcement.providerId,
      condominiumId: row.announcement.condominiumId,
      condoName: row.condominium.name,
      condoCity: row.condominium.city,
      condoState: row.condominium.state,
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
    }));
  }
}
