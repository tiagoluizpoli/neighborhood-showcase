import { db } from '@neighborhood-showcase/db';
import { announcement as announcementSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type {
  Announcement,
  AnnouncementStatus,
} from '../../domain/entities/announcement.entity';
import type {
  AnnouncementRepository,
  CreateAnnouncementRepositoryInput,
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
