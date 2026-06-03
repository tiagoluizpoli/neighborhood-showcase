import type { condominium as condoSchema } from '@neighborhood-showcase/db/schema/showcase';
import { Condominium } from '../../../domain/entities/condominium.entity';
import type { EntityMapper } from '../../../domain/mapper';

type CondoSchemaSelect = typeof condoSchema.$inferSelect;
type CondoSchemaInsert = typeof condoSchema.$inferInsert;

export class CondominiumMapper
  implements EntityMapper<CondoSchemaSelect, Condominium, CondoSchemaInsert>
{
  toDomain(raw: CondoSchemaSelect): Condominium {
    return new Condominium(
      {
        name: raw.name,
        city: raw.city,
        state: raw.state,
        cep: raw.cep,
        contactInfo: raw.contactInfo,
        status: raw.status,
        createdBy: raw.createdBy,
        proofUrl: raw.proofUrl,
        createdAt: raw.createdAt,
        deletedAt: raw.deletedAt,
        addressId: raw.addressId,
        number: raw.number,
        latitude: raw.latitude,
        longitude: raw.longitude,
        geog: raw.geog,
      },
      raw.id,
    );
  }

  toPersistence(entity: Condominium): CondoSchemaInsert {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city,
      state: entity.state,
      cep: entity.cep,
      contactInfo: entity.contactInfo,
      status: entity.status,
      createdBy: entity.createdBy,
      proofUrl: entity.proofUrl,
      createdAt: entity.createdAt,
      deletedAt: entity.deletedAt,
      addressId: entity.addressId,
      number: entity.number,
      latitude: entity.latitude,
      longitude: entity.longitude,
      geog: entity.geog,
    };
  }
}
