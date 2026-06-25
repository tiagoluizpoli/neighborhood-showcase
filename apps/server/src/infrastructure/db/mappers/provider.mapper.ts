import type { provider as providerSchema } from '@neighborhood-showcase/db/schema/showcase';
import { Provider } from '../../../domain/entities/provider.entity';
import type { EntityMapper } from '../../../domain/mapper';

type ProviderSchemaSelect = typeof providerSchema.$inferSelect;
type ProviderSchemaInsert = typeof providerSchema.$inferInsert;

export class ProviderMapper
  implements EntityMapper<ProviderSchemaSelect, Provider, ProviderSchemaInsert>
{
  toDomain(raw: ProviderSchemaSelect): Provider {
    return new Provider(
      {
        ownerId: raw.ownerId,
        deletedAt: raw.deletedAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  toPersistence(entity: Provider): ProviderSchemaInsert {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      deletedAt: entity.deletedAt ?? null,
      updatedAt: entity.updatedAt,
    };
  }
}
