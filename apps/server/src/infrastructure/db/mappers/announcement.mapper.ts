import type { announcement as announcementSchema } from '@neighborhood-showcase/db/schema/showcase';
import { Announcement } from '../../../domain/entities/announcement.entity';
import type { AnnouncementContactSettings } from '../../../domain/entities/contact';
import type { EntityMapper } from '../../../domain/mapper';
import { rowToContactSettings } from './announcement-contact';
import { ctaToRow, rowToCta } from './announcement-cta';

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
        contact: rowToContactSettings({
          mode: raw.contactMode,
          custom: raw.contactCustom ?? null,
        }),
        cta: rowToCta(raw.cta),
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
    const contact: AnnouncementContactSettings = entity.contact;
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
      contactMode: contact.mode,
      contactCustom: contact.mode === 'custom' ? contact.custom : null,
      cta: ctaToRow(entity.cta),
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
