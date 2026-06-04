import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { PaymentRepository } from '../../../domain/repositories/payment.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { EmailService } from '../../../domain/services/email.service';
import { DomainError } from '../../../shared/domain-error';

export class WebhookPaymentNotFoundError extends DomainError {
  constructor() {
    super('Payment record not found');
  }
}

export class WebhookAssociatedAnnouncementNotFoundError extends DomainError {
  constructor() {
    super('Associated announcement not found');
  }
}

export interface ProcessWebhookPaymentInput {
  billingId: string;
}

export interface ProcessWebhookPaymentResult {
  status: 'success' | 'already_processed';
}

export class ProcessWebhookPayment {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly announcementRepo: AnnouncementRepository,
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    input: ProcessWebhookPaymentInput,
  ): Promise<ProcessWebhookPaymentResult> {
    const paymentRecord = await this.paymentRepo.findByBillingId(
      input.billingId,
    );

    if (!paymentRecord) {
      throw new WebhookPaymentNotFoundError();
    }

    if (paymentRecord.status === 'PAID') {
      return { status: 'already_processed' };
    }

    const announcementRecord = await this.announcementRepo.findById(
      paymentRecord.announcementId,
    );

    if (!announcementRecord) {
      throw new WebhookAssociatedAnnouncementNotFoundError();
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Persist payment completion and announcement activation inside a database transaction
    await this.paymentRepo.completePaymentAndActivate(
      paymentRecord.id,
      announcementRecord.id,
      expiresAt,
    );

    // Send email confirmation using EmailService in the background
    const provider = await this.userRepo.findById(
      announcementRecord.providerId,
    );
    if (provider?.email) {
      const customerName = provider.name || 'Provedor';
      const announcementTitle = announcementRecord.title;

      this.emailService
        .sendEmail({
          to: provider.email,
          subject: `Seu anúncio "${announcementTitle}" está ativo!`,
          html: `
          <p>Olá, ${customerName}.</p>
          <p>Seu pagamento foi confirmado com sucesso!</p>
          <p>O seu anúncio <strong>${announcementTitle}</strong> já está ativo e visível na vitrine pública do seu condomínio.</p>
          <p>Ele ficará ativo pelos próximos 30 dias.</p>
          <br/>
          <p>Atenciosamente,</p>
          <p>Administração - Neighborhood Showcase</p>
        `,
        })
        .catch((error) => {
          console.error('Email confirmation dispatch failed:', error);
        });
    }

    return { status: 'success' };
  }
}
