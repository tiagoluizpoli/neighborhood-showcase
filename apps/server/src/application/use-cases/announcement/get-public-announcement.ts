import type {
  AnnouncementRepository,
  PublicAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';
import { DomainError } from '../../../shared/domain-error';

export class AnnouncementNotFoundError extends DomainError {
  constructor() {
    super('Anúncio não encontrado ou inativo.');
  }
}

export interface GetPublicAnnouncementInput {
  id: string;
}

export class GetPublicAnnouncement {
  constructor(private readonly announcementRepo: AnnouncementRepository) {}

  async execute(
    input: GetPublicAnnouncementInput,
  ): Promise<PublicAnnouncementDTO> {
    const result = await this.announcementRepo.findPublicById(input.id);

    if (!result) {
      throw new AnnouncementNotFoundError();
    }

    return result;
  }
}
