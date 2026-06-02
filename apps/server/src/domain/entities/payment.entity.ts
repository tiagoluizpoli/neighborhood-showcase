import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED';

export interface PaymentProps extends AuditableProps {
  announcementId: string;
  billingId: string;
  amountCents: number;
  status: PaymentStatus;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
}

export class Payment extends AuditableEntity<PaymentProps> {
  get announcementId(): string {
    return this.props.announcementId;
  }

  get billingId(): string {
    return this.props.billingId;
  }

  get amountCents(): number {
    return this.props.amountCents;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get pixQrCode(): string | null | undefined {
    return this.props.pixQrCode;
  }

  get pixCopyPaste(): string | null | undefined {
    return this.props.pixCopyPaste;
  }

  public pay(): void {
    this.props.status = 'PAID';
  }

  public expire(): void {
    this.props.status = 'EXPIRED';
  }

  public refund(): void {
    this.props.status = 'REFUNDED';
  }
}
