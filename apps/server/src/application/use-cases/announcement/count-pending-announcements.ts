import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';

export interface CountPendingAnnouncementsInput {
  condominiumId: string;
}

export class CountPendingAnnouncements {
  constructor(
    private readonly announcementRepository: AnnouncementRepository,
  ) {}

  async execute(input: CountPendingAnnouncementsInput): Promise<number> {
    return this.announcementRepository.countPendingByCondo(input.condominiumId);
  }
}
