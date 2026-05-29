import { db } from '@base-fullstack-template/db';
import { announcement as announcementSchema } from '@base-fullstack-template/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type {
  Announcement,
  AnnouncementStatus,
} from '../../domain/entities/announcement.entity';
import type {
  AnnouncementRepository,
  CreateAnnouncementRepositoryInput,
} from '../../domain/repositories/announcement.repository';

export class DrizzleAnnouncementRepository implements AnnouncementRepository {
  async create(
    input: CreateAnnouncementRepositoryInput,
  ): Promise<Announcement> {
    const [inserted] = await db
      .insert(announcementSchema)
      .values({
        id: input.id,
        providerId: input.providerId,
        condominiumId: input.condominiumId,
        title: input.title,
        subtitle: input.subtitle || null,
        description: input.description,
        priceCents: input.priceCents || null,
        imageUrl: input.imageUrl,
        category: input.category,
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

    return inserted as Announcement;
  }

  async findById(id: string): Promise<Announcement | null> {
    const [found] = await db
      .select()
      .from(announcementSchema)
      .where(eq(announcementSchema.id, id))
      .limit(1);

    return (found as Announcement) || null;
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

    return updated as Announcement;
  }

  async update(
    id: string,
    input: Partial<Omit<Announcement, 'id' | 'providerId' | 'condominiumId' | 'createdAt'>>,
  ): Promise<Announcement> {
    const [updated] = await db
      .update(announcementSchema)
      .set(input)
      .where(eq(announcementSchema.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update announcement for ${id}`);
    }

    return updated as Announcement;
  }
}
