export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED';

export interface Payment {
  id: string;
  announcementId: string;
  billingId: string;
  amountCents: number;
  status: PaymentStatus;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
