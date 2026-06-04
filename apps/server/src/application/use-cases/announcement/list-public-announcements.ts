import type {
  AnnouncementRepository,
  ListPublicAnnouncementsInput,
  PublicAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';

export type PublicAnnouncementItem = PublicAnnouncementDTO;

export class ListPublicAnnouncements {
  constructor(private readonly announcementRepo: AnnouncementRepository) {}

  async execute(
    input: ListPublicAnnouncementsInput,
  ): Promise<PublicAnnouncementItem[]> {
    return this.announcementRepo.findPublic(input);
  }
}
