import type { Payment } from '../../entities/payment.entity';

export interface GeneratePaymentIntentInput {
  announcementId: string;
  providerId: string;
  customerName: string;
  customerEmail: string;
}

export interface GeneratePaymentIntentUseCase {
  execute(input: GeneratePaymentIntentInput): Promise<Payment>;
}
