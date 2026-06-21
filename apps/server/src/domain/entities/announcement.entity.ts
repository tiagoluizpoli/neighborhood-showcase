import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';
import { DomainError } from '../../shared/domain-error';
import {
  type AnnouncementContactSettings,
  hasWhatsappBaseline,
  WhatsappBaselineRequiredError,
} from './contact';
import { type AnnouncementCta, validateCta } from './cta';

export type AnnouncementStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'SUSPENDED';

export class InvalidAnnouncementTitleError extends DomainError {}

export class InvalidAnnouncementDescriptionError extends DomainError {}

export class AnnouncementCategoryRequiredError extends DomainError {
  constructor() {
    super('A categoria do anúncio é obrigatória.');
  }
}

export class AnnouncementImageRequiredError extends DomainError {
  constructor() {
    super('A imagem de capa do anúncio é obrigatória.');
  }
}

export interface AnnouncementProps extends AuditableProps {
  providerId: string;
  condominiumId: string | null;
  providerAssignmentId: string | null;
  title: string;
  subtitle?: string | null;
  description: string;
  priceCents?: number | null;
  imageUrl: string;
  categoryId: string;
  tags: string[];
  contact: AnnouncementContactSettings;
  cta: AnnouncementCta;
  showVerifiedBadge: boolean;
  flaggedForReview: boolean;
  status: AnnouncementStatus;
  paidAt?: Date | null;
  expiresAt?: Date | null;
  deletedAt?: Date | null;
  suspensionReason?: string | null;
}

export class Announcement extends AuditableEntity<AnnouncementProps> {
  constructor(props: AnnouncementProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    Announcement.validate({
      title: this.props.title,
      description: this.props.description,
      categoryId: this.props.categoryId,
      imageUrl: this.props.imageUrl,
      contact: this.props.contact,
      cta: this.props.cta,
    });
  }

  private static validate(input: {
    title: string;
    description: string;
    categoryId: string;
    imageUrl: string;
    contact: AnnouncementContactSettings;
    cta: AnnouncementCta;
  }): void {
    if (!input.title || input.title.trim().length < 3) {
      throw new InvalidAnnouncementTitleError(
        'O título do anúncio deve ter pelo menos 3 caracteres.',
      );
    }
    if (input.title.length > 100) {
      throw new InvalidAnnouncementTitleError(
        'O título do anúncio não pode exceder 100 caracteres.',
      );
    }
    if (!input.description || input.description.trim().length < 10) {
      throw new InvalidAnnouncementDescriptionError(
        'A descrição do anúncio deve ter pelo menos 10 caracteres.',
      );
    }
    if (input.description.length > 2000) {
      throw new InvalidAnnouncementDescriptionError(
        'A descrição do anúncio não pode exceder 2000 caracteres.',
      );
    }
    if (!input.categoryId || input.categoryId.trim().length === 0) {
      throw new AnnouncementCategoryRequiredError();
    }
    if (!input.imageUrl || input.imageUrl.trim().length === 0) {
      throw new AnnouncementImageRequiredError();
    }

    Announcement.validateContact(input.contact);
    validateCta(input.cta);
  }

  // WhatsApp is the locked publishable baseline. A custom announcement must
  // carry a valid number itself; an inherited one resolves against provider
  // defaults at publish/render time (enforced where defaults are available).
  private static validateContact(contact: AnnouncementContactSettings): void {
    if (contact.mode === 'custom') {
      if (!contact.custom || !hasWhatsappBaseline(contact.custom)) {
        throw new WhatsappBaselineRequiredError();
      }
    }
  }

  get providerId(): string {
    return this.props.providerId;
  }

  get condominiumId(): string | null {
    return this.props.condominiumId;
  }

  get providerAssignmentId(): string | null {
    return this.props.providerAssignmentId;
  }

  get title(): string {
    return this.props.title;
  }

  get subtitle(): string | null | undefined {
    return this.props.subtitle;
  }

  get description(): string {
    return this.props.description;
  }

  get priceCents(): number | null | undefined {
    return this.props.priceCents;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get contact(): AnnouncementContactSettings {
    return this.props.contact;
  }

  get cta(): AnnouncementCta {
    return this.props.cta;
  }

  get showVerifiedBadge(): boolean {
    return this.props.showVerifiedBadge;
  }

  get flaggedForReview(): boolean {
    return this.props.flaggedForReview;
  }

  get status(): AnnouncementStatus {
    return this.props.status;
  }

  get paidAt(): Date | null | undefined {
    return this.props.paidAt;
  }

  get expiresAt(): Date | null | undefined {
    return this.props.expiresAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get suspensionReason(): string | null | undefined {
    return this.props.suspensionReason;
  }

  public suspend(reason: string): void {
    this.props.status = 'SUSPENDED';
    this.props.suspensionReason = reason;
    this.props.flaggedForReview = false;
  }

  public reinstate(): void {
    this.props.status = 'ACTIVE';
    this.props.suspensionReason = null;
    this.props.flaggedForReview = false;
  }

  public publish(paidAt: Date, expiresAt: Date): void {
    this.props.status = 'ACTIVE';
    this.props.paidAt = paidAt;
    this.props.expiresAt = expiresAt;
  }
}
