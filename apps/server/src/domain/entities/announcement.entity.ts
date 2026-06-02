import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';
import { DomainError } from '../../shared/domain-error';

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

export class AnnouncementContactRequiredError extends DomainError {
  constructor() {
    super(
      'Forneça pelo menos um meio de contato (WhatsApp, Instagram ou Website).',
    );
  }
}

export interface AnnouncementProps extends AuditableProps {
  providerId: string;
  condominiumId: string | null;
  providerLocationId: string | null;
  title: string;
  subtitle?: string | null;
  description: string;
  priceCents?: number | null;
  imageUrl: string;
  category: string;
  tags: string[];
  contactLinks: {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
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
      category: this.props.category,
      imageUrl: this.props.imageUrl,
      contactLinks: this.props.contactLinks,
    });
  }

  private static validate(input: {
    title: string;
    description: string;
    category: string;
    imageUrl: string;
    contactLinks: {
      whatsapp?: string;
      instagram?: string;
      website?: string;
    };
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
    if (!input.category || input.category.trim().length === 0) {
      throw new AnnouncementCategoryRequiredError();
    }
    if (!input.imageUrl || input.imageUrl.trim().length === 0) {
      throw new AnnouncementImageRequiredError();
    }

    const { whatsapp, instagram, website } = input.contactLinks;
    if (!whatsapp?.trim() && !instagram?.trim() && !website?.trim()) {
      throw new AnnouncementContactRequiredError();
    }
  }

  get providerId(): string {
    return this.props.providerId;
  }

  get condominiumId(): string | null {
    return this.props.condominiumId;
  }

  get providerLocationId(): string | null {
    return this.props.providerLocationId;
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

  get category(): string {
    return this.props.category;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get contactLinks(): {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  } {
    return this.props.contactLinks;
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
