import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { PaymentRepository } from '../../../domain/repositories/payment.repository';

export class PaymentNotFoundError extends Error {
  constructor() {
    super('Nenhum pagamento registrado para este anúncio.');
  }
}

export class AnnouncementAccessDeniedError extends Error {
  constructor() {
    super('Acesso negado. Você não é o proprietário deste anúncio.');
  }
}

export interface GetPaymentStatusInput {
  announcementId: string;
  providerId: string;
}

export interface PaymentStatusResult {
  id: string;
  status: string;
  billingId: string;
}

export class GetPaymentStatus {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly paymentRepo: PaymentRepository,
  ) {}

  async execute(input: GetPaymentStatusInput): Promise<PaymentStatusResult> {
    const payment = await this.paymentRepo.findByAnnouncementId(
      input.announcementId,
    );

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    const announcement = await this.announcementRepo.findById(
      input.announcementId,
    );

    if (!announcement || announcement.providerId !== input.providerId) {
      throw new AnnouncementAccessDeniedError();
    }

    return {
      id: payment.id,
      status: payment.status,
      billingId: payment.billingId,
    };
  }
}
