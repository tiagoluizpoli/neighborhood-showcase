export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface EmailService {
  sendEmail(input: SendEmailInput): Promise<void>;
}
