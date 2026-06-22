import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';

/** Ceiling on how many tag suggestions the authoring autocomplete receives. */
const TAG_SUGGESTION_LIMIT = 100;

export class ListTagSuggestions {
  constructor(private readonly announcementRepo: AnnouncementRepository) {}

  async execute(): Promise<string[]> {
    return this.announcementRepo.listTagSuggestions(TAG_SUGGESTION_LIMIT);
  }
}
