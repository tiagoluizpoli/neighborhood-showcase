import type { Payment, PaymentStatus } from '../entities/payment.entity';

export interface CreatePaymentRepositoryInput {
  id: string;
  announcementId: string;
  billingId: string;
  amountCents: number;
  status?: PaymentStatus;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
}

export interface PaymentRepository {
  create(input: CreatePaymentRepositoryInput): Promise<Payment>;
  findByAnnouncementId(announcementId: string): Promise<Payment | null>;
  findByBillingId(billingId: string): Promise<Payment | null>;
  updateStatus(id: string, status: PaymentStatus): Promise<Payment>;
  completePaymentAndActivate(
    paymentId: string,
    announcementId: string,
    expiresAt: Date,
  ): Promise<void>;
}
