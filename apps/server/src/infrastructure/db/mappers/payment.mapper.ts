import type { payment as paymentSchema } from '@neighborhood-showcase/db/schema/showcase';
import { Payment } from '../../../domain/entities/payment.entity';
import type { EntityMapper } from '../../../domain/mapper';

type PaymentSchemaSelect = typeof paymentSchema.$inferSelect;
type PaymentSchemaInsert = typeof paymentSchema.$inferInsert;

export class PaymentMapper
  implements EntityMapper<PaymentSchemaSelect, Payment, PaymentSchemaInsert>
{
  toDomain(raw: PaymentSchemaSelect): Payment {
    return new Payment(
      {
        announcementId: raw.announcementId,
        billingId: raw.billingId,
        amountCents: raw.amountCents,
        status: raw.status,
        pixQrCode: raw.pixQrCode,
        pixCopyPaste: raw.pixCopyPaste,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  toPersistence(entity: Payment): PaymentSchemaInsert {
    return {
      id: entity.id,
      announcementId: entity.announcementId,
      billingId: entity.billingId,
      amountCents: entity.amountCents,
      status: entity.status,
      pixQrCode: entity.pixQrCode,
      pixCopyPaste: entity.pixCopyPaste,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
