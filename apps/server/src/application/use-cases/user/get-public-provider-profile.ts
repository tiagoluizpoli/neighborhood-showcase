import type {
  AnnouncementRepository,
  ProviderAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class PublicProviderNotFoundError extends DomainError {
  constructor() {
    super('Prestador não encontrado');
  }
}

export interface GetPublicProviderProfileInput {
  providerId: string;
}

export interface PublicProviderProfileResult {
  provider: {
    id: string;
    name: string;
    avatarUrl: string | null;
    socialLinks: Record<string, string | undefined>;
    isVerified: boolean;
  };
  announcements: ProviderAnnouncementDTO[];
}

export class GetPublicProviderProfile {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly assignmentRepo: AssignmentRepository,
    private readonly announcementRepo: AnnouncementRepository,
  ) {}

  async execute(
    input: GetPublicProviderProfileInput,
  ): Promise<PublicProviderProfileResult> {
    const provider = await this.userRepo.findPublicProviderById(
      input.providerId,
    );

    if (
      !provider ||
      provider.status === 'BANNED' ||
      provider.deletedAt != null
    ) {
      throw new PublicProviderNotFoundError();
    }

    const isVerified = await this.assignmentRepo.hasApprovedResidentAssignment(
      input.providerId,
    );

    const announcements = await this.announcementRepo.findActiveByProviderId(
      input.providerId,
      provider.name,
      provider.avatarUrl,
    );

    return {
      provider: {
        id: provider.id,
        name: provider.name,
        avatarUrl: provider.avatarUrl,
        socialLinks: provider.socialLinks,
        isVerified,
      },
      announcements,
    };
  }
}
