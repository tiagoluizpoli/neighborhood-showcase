import { db } from '@neighborhood-showcase/db';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerAssignment as providerAssignmentSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, isNull } from 'drizzle-orm';
import type {
  Announcement,
  AnnouncementStatus,
} from '../../../domain/entities/announcement.entity';
import type {
  CreateAnnouncementRepositoryInput,
  DashboardAnnouncementDTO,
  ProviderAnnouncementDTO,
  UpdateAnnouncementRepositoryInput,
} from '../../../domain/repositories/announcement.repository';
import type { AnnouncementMapper } from '../mappers/announcement.mapper';
import {
  contactSettingsToLinks,
  rowToContactSettings,
} from '../mappers/announcement-contact';

export async function createAnnouncement(
  mapper: AnnouncementMapper,
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
      contactMode: input.contact.mode,
      contactCustom:
        input.contact.mode === 'custom' ? input.contact.custom : null,
      showVerifiedBadge: input.showVerifiedBadge,
      flaggedForReview: false,
      status: input.status || 'DRAFT',
    })
    .returning();

  if (!inserted) {
    throw new Error('Failed to create announcement');
  }

  return mapper.toDomain(inserted);
}

export async function findAnnouncementById(
  mapper: AnnouncementMapper,
  id: string,
): Promise<Announcement | null> {
  const [found] = await db
    .select()
    .from(announcementSchema)
    .where(eq(announcementSchema.id, id))
    .limit(1);

  return found ? mapper.toDomain(found) : null;
}

export async function updateAnnouncementStatus(
  mapper: AnnouncementMapper,
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

  return mapper.toDomain(updated);
}

export async function updateAnnouncement(
  mapper: AnnouncementMapper,
  id: string,
  input: UpdateAnnouncementRepositoryInput,
): Promise<Announcement> {
  const { contact, ...rest } = input;
  const contactSet =
    contact === undefined
      ? {}
      : {
          contactMode: contact.mode,
          contactCustom: contact.mode === 'custom' ? contact.custom : null,
        };

  const [updated] = await db
    .update(announcementSchema)
    .set({ ...rest, ...contactSet })
    .where(eq(announcementSchema.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Failed to update announcement for ${id}`);
  }

  return mapper.toDomain(updated);
}

export async function findActiveAnnouncementsByProviderId(
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
      contactMode: announcementSchema.contactMode,
      contactCustom: announcementSchema.contactCustom,
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
      eq(announcementSchema.providerAssignmentId, providerAssignmentSchema.id),
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

  return rows.map((row) => {
    const contact = rowToContactSettings({
      mode: row.contactMode,
      custom: row.contactCustom ?? null,
    });
    return {
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
      contact,
      contactLinks: contactSettingsToLinks(contact),
      showVerifiedBadge: row.showVerifiedBadge,
      status: row.status,
      createdAt: row.createdAt,
      condoName: row.condoName ?? null,
      condoCity: row.condoCity ?? row.providerLocCity ?? '',
      condoState: row.condoState ?? row.providerLocState ?? '',
      providerName,
      providerAvatarUrl,
    };
  });
}

export async function findAnnouncementIdsByProviderId(
  providerId: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: announcementSchema.id })
    .from(announcementSchema)
    .where(
      and(
        eq(announcementSchema.providerId, providerId),
        isNull(announcementSchema.deletedAt),
      ),
    );

  return rows.map((row) => row.id);
}

export async function findDashboardAnnouncementsByProviderId(
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
      contactMode: announcementSchema.contactMode,
      contactCustom: announcementSchema.contactCustom,
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

  return rows.map((row) => {
    const contact = rowToContactSettings({
      mode: row.contactMode,
      custom: row.contactCustom ?? null,
    });
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? null,
      description: row.description,
      priceCents: row.priceCents ?? null,
      imageUrl: row.imageUrl,
      category: row.categoryName,
      categoryId: row.categoryId,
      tags: row.tags ?? [],
      contact,
      contactLinks: contactSettingsToLinks(contact),
      showVerifiedBadge: row.showVerifiedBadge,
      flaggedForReview: row.flaggedForReview,
      status: row.status,
      paidAt: row.paidAt ?? null,
      expiresAt: row.expiresAt ?? null,
      createdAt: row.createdAt,
      suspensionReason: row.suspensionReason ?? null,
      condoName: row.condoName || '',
      providerAssignmentId: row.providerAssignmentId ?? null,
    };
  });
}
