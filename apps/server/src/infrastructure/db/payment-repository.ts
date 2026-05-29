import { db } from '@base-fullstack-template/db';
import { payment as paymentSchema } from '@base-fullstack-template/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type {
  Payment,
  PaymentStatus,
} from '../../domain/entities/payment.entity';
import type {
  CreatePaymentRepositoryInput,
  PaymentRepository,
} from '../../domain/repositories/payment.repository';

export class DrizzlePaymentRepository implements PaymentRepository {
  async create(input: CreatePaymentRepositoryInput): Promise<Payment> {
    const [inserted] = await db
      .insert(paymentSchema)
      .values({
        id: input.id,
        announcementId: input.announcementId,
        billingId: input.billingId,
        amountCents: input.amountCents,
        status: input.status || 'PENDING',
        pixQrCode: input.pixQrCode || null,
        pixCopyPaste: input.pixCopyPaste || null,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create payment record');
    }

    return inserted as Payment;
  }

  async findByAnnouncementId(announcementId: string): Promise<Payment | null> {
    const [found] = await db
      .select()
      .from(paymentSchema)
      .where(eq(paymentSchema.announcementId, announcementId))
      .limit(1);

    return (found as Payment) || null;
  }

  async findByBillingId(billingId: string): Promise<Payment | null> {
    const [found] = await db
      .select()
      .from(paymentSchema)
      .where(eq(paymentSchema.billingId, billingId))
      .limit(1);

    return (found as Payment) || null;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const [updated] = await db
      .update(paymentSchema)
      .set({ status })
      .where(eq(paymentSchema.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update payment status for payment ${id}`);
    }

    return updated as Payment;
  }
}
