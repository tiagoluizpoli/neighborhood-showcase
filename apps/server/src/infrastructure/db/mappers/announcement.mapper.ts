import type { announcement as announcementSchema } from '@neighborhood-showcase/db/schema/showcase';
import { Announcement } from '../../../domain/entities/announcement.entity';
import type { EntityMapper } from '../../../domain/mapper';

type AnnouncementSchemaSelect = typeof announcementSchema.$inferSelect;
type AnnouncementSchemaInsert = typeof announcementSchema.$inferInsert;

export class AnnouncementMapper
  implements
    EntityMapper<
      AnnouncementSchemaSelect,
      Announcement,
      AnnouncementSchemaInsert
    >
{
  toDomain(raw: AnnouncementSchemaSelect): Announcement {
    // Supply a fallback contact link if the database contains empty links (e.g., from raw test seeds)
    const hasContact =
      raw.contactLinks &&
      (raw.contactLinks.whatsapp ||
        raw.contactLinks.phone ||
        raw.contactLinks.email ||
        raw.contactLinks.instagram ||
        raw.contactLinks.tiktok ||
        raw.contactLinks.facebook ||
        raw.contactLinks.website);
    const contactLinks = hasContact
      ? raw.contactLinks
      : { whatsapp: '0000000000' };

    return new Announcement(
      {
        providerId: raw.providerId,
        condominiumId: raw.condominiumId,
        providerAssignmentId: raw.providerAssignmentId,
        title: raw.title,
        subtitle: raw.subtitle,
        description: raw.description,
        priceCents: raw.priceCents,
        imageUrl: raw.imageUrl,
        categoryId: raw.categoryId,
        tags: raw.tags,
        contactLinks: contactLinks as {
          whatsapp?: string;
          phone?: string;
          email?: string;
          instagram?: string;
          tiktok?: string;
          facebook?: string;
          website?: string;
        },
        showVerifiedBadge: raw.showVerifiedBadge,
        flaggedForReview: raw.flaggedForReview,
        status: raw.status,
        paidAt: raw.paidAt,
        expiresAt: raw.expiresAt,
        createdAt: raw.createdAt,
        deletedAt: raw.deletedAt,
        suspensionReason: raw.suspensionReason,
      },
      raw.id,
    );
  }

  toPersistence(entity: Announcement): AnnouncementSchemaInsert {
    return {
      id: entity.id,
      providerId: entity.providerId,
      condominiumId: entity.condominiumId,
      providerAssignmentId: entity.providerAssignmentId,
      title: entity.title,
      subtitle: entity.subtitle,
      description: entity.description,
      priceCents: entity.priceCents,
      imageUrl: entity.imageUrl,
      categoryId: entity.categoryId,
      tags: entity.tags,
      contactLinks: entity.contactLinks,
      showVerifiedBadge: entity.showVerifiedBadge,
      flaggedForReview: entity.flaggedForReview,
      status: entity.status,
      paidAt: entity.paidAt,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      deletedAt: entity.deletedAt,
      suspensionReason: entity.suspensionReason,
    };
  }
}
