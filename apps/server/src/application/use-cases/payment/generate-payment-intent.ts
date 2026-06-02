import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { Payment } from '../../../domain/entities/payment.entity';
import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { PaymentRepository } from '../../../domain/repositories/payment.repository';
import type {
  GeneratePaymentIntentInput,
  GeneratePaymentIntentUseCase,
} from '../../../domain/use-cases/payment/generate-payment-intent.use-case';
import type { AbacatePayClient } from '../../../infrastructure/payment/abacatepay.client';

export class GeneratePaymentIntent implements GeneratePaymentIntentUseCase {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly paymentRepo: PaymentRepository,
    private readonly abacatePayClient: AbacatePayClient,
  ) {}

  async execute(input: GeneratePaymentIntentInput): Promise<Payment> {
    const announcement = await this.announcementRepo.findById(
      input.announcementId,
    );

    if (!announcement) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Anúncio não encontrado.',
      });
    }

    // Verify ownership
    if (announcement.providerId !== input.providerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Acesso negado. Você não é o proprietário deste anúncio.',
      });
    }

    // Validate announcement status
    if (announcement.status === 'ACTIVE') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Este anúncio já está ativo e publicado.',
      });
    }

    if (announcement.status === 'SUSPENDED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Anúncios suspensos não podem receber pagamentos.',
      });
    }

    // Return existing pending payment if it exists
    const existingPayment = await this.paymentRepo.findByAnnouncementId(
      input.announcementId,
    );
    if (existingPayment && existingPayment.status === 'PENDING') {
      return existingPayment;
    }

    // Generate new Checkout via AbacatePay (Fixed Fee: R$ 2,00 = 200 cents)
    const checkout = await this.abacatePayClient.createTransparentCheckout({
      announcementId: input.announcementId,
      amountCents: 200,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
    });

    // Create database record
    const paymentId = crypto.randomUUID();
    const payment = await this.paymentRepo.create({
      id: paymentId,
      announcementId: input.announcementId,
      billingId: checkout.billingId,
      amountCents: 200,
      status: 'PENDING',
      pixQrCode: checkout.pixQrCode,
      pixCopyPaste: checkout.pixCopyPaste,
    });

    // Transition announcement status to PENDING_PAYMENT
    await this.announcementRepo.updateStatus(
      input.announcementId,
      'PENDING_PAYMENT',
    );

    return payment;
  }
}
