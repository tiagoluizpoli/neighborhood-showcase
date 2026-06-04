import { env } from '@neighborhood-showcase/env/server';
import { Resend } from 'resend';
import type {
  EmailService,
  SendEmailInput,
} from '../../domain/services/email.service';

export class ResendEmailService implements EmailService {
  private readonly resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 'mock-resend-key') {
      this.resend = new Resend(env.RESEND_API_KEY);
    }
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    if (!this.resend) {
      console.log(`[MOCK EMAIL (Resend)] To: ${input.to}`);
      console.log(`[MOCK EMAIL (Resend)] Subject: ${input.subject}`);
      console.log(`[MOCK EMAIL (Resend)] Body: ${input.html}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
    } catch (error) {
      console.error('Resend email dispatch failed:', error);
      throw error;
    }
  }
}
