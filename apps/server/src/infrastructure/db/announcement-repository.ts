import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  category as categorySchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type {
  Announcement,
  AnnouncementStatus,
} from '../../domain/entities/announcement.entity';
import type {
  AnnouncementRepository,
  CreateAnnouncementRepositoryInput,
  ModerationAnnouncementDTO,
  PublicAnnouncementDTO,
  UpdateAnnouncementRepositoryInput,
} from '../../domain/repositories/announcement.repository';
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
        providerLocationId: input.providerLocationId || null,
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
    } else if (found.providerLocationId) {
      const [loc] = await db
        .select({ city: addressSchema.city, state: addressSchema.state })
        .from(providerLocationSchema)
        .innerJoin(
          addressSchema,
          eq(providerLocationSchema.addressId, addressSchema.id),
        )
        .where(eq(providerLocationSchema.id, found.providerLocationId))
        .limit(1);
      if (loc) {
        condoCity = loc.city;
        condoState = loc.state;
      }
    }

    const [provider] = await db
      .select({ name: userSchema.name, image: userSchema.image })
      .from(userSchema)
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
      providerLocationId: found.providerLocationId,
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
      providerName: provider?.name ?? '',
      providerAvatarUrl: provider?.image ?? null,
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
}
