import { db } from '@base-fullstack-template/db';
import { announcement as announcementSchema } from '@base-fullstack-template/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type { Announcement } from '../../domain/entities/announcement.entity';
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
}
