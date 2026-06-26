import type {
  AnnouncementRepository,
  ProviderAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type {
  PublicVerifiedCondoDTO,
  UserRepository,
} from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class PublicProviderNotFoundError extends DomainError {
  constructor() {
    super('Prestador não encontrado');
  }
}

export interface GetPublicProviderProfileInput {
  providerId: string;
}

export interface PublicProviderProfileView {
  id: string;
  displayName: string;
  companyName: string | null;
  tradeName: string | null;
  logoUrl: string | null;
  logoOriginalUrl: string | null;
  bannerUrl: string | null;
  bannerOriginalUrl: string | null;
  publicDescription: string | null;
  socialLinks: Record<string, string | undefined>;
  isVerified: boolean;
  verifiedCondo: PublicVerifiedCondoDTO | null;
}

export interface VerifiedProviderEligibility {
  isVerified: boolean;
  verifiedCondo: PublicVerifiedCondoDTO | null;
}

export interface AssignmentEligibilityInput {
  providerId: string;
  verifiedCondo: PublicVerifiedCondoDTO | null;
}

export interface PublicProviderProfileResult {
  provider: PublicProviderProfileView;
  announcements: ProviderAnnouncementDTO[];
}

export class GetPublicProviderProfile {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly assignmentRepo: AssignmentRepository,
    private readonly announcementRepo: AnnouncementRepository,
  ) {}

  private async resolveVerifiedProviderEligibility(
    input: AssignmentEligibilityInput,
  ): Promise<VerifiedProviderEligibility> {
    if (input.verifiedCondo !== null) {
      return {
        isVerified: true,
        verifiedCondo: input.verifiedCondo,
      };
    }

    const hasApprovedResidentAssignment =
      await this.assignmentRepo.hasApprovedResidentAssignment(input.providerId);

    return {
      isVerified: hasApprovedResidentAssignment,
      verifiedCondo: null,
    };
  }

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

    const verifiedProviderEligibility =
      await this.resolveVerifiedProviderEligibility({
        providerId: input.providerId,
        verifiedCondo: provider.verifiedCondo,
      });

    const announcements = await this.announcementRepo.findActiveByProviderId(
      input.providerId,
      provider.displayName,
      provider.avatarUrl,
    );

    return {
      provider: {
        id: provider.id,
        displayName: provider.displayName,
        companyName: provider.companyName,
        tradeName: provider.tradeName,
        logoUrl: provider.logoUrl,
        logoOriginalUrl: provider.logoOriginalUrl,
        bannerUrl: provider.bannerUrl,
        bannerOriginalUrl: provider.bannerOriginalUrl,
        publicDescription: provider.publicDescription,
        socialLinks: provider.socialLinks,
        isVerified: verifiedProviderEligibility.isVerified,
        verifiedCondo: verifiedProviderEligibility.verifiedCondo,
      },
      announcements,
    };
  }
}
