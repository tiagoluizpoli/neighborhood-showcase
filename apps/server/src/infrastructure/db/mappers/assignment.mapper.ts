import type { providerLocation as assignSchema } from '@neighborhood-showcase/db/schema/showcase';
import { Assignment } from '../../../domain/entities/assignment.entity';
import type { EntityMapper } from '../../../domain/mapper';

type AssignSchemaSelect = typeof assignSchema.$inferSelect;
type AssignSchemaInsert = typeof assignSchema.$inferInsert;

export class AssignmentMapper
  implements EntityMapper<AssignSchemaSelect, Assignment, AssignSchemaInsert>
{
  toDomain(raw: AssignSchemaSelect): Assignment {
    return new Assignment(
      {
        providerId: raw.providerId,
        condominiumId: raw.condominiumId,
        addressId: raw.addressId,
        number: raw.number,
        type: raw.type,
        status: raw.status,
        unitInfo: raw.unitInfo,
        proofOfResidency: raw.proofOfResidency,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  toPersistence(entity: Assignment): AssignSchemaInsert {
    return {
      id: entity.id,
      providerId: entity.providerId,
      condominiumId: entity.condominiumId,
      addressId: entity.addressId,
      number: entity.number,
      type: entity.type,
      status: entity.status,
      unitInfo: entity.unitInfo,
      proofOfResidency: entity.proofOfResidency,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
