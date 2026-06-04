import type { blacklistedIdentifier as blacklistSchema } from '@neighborhood-showcase/db/schema/auth';
import { BlacklistedIdentifier } from '../../../domain/entities/blacklist.entity';
import type { EntityMapper } from '../../../domain/mapper';

type BlacklistSchemaSelect = typeof blacklistSchema.$inferSelect;
type BlacklistSchemaInsert = typeof blacklistSchema.$inferInsert;

export class BlacklistMapper
  implements
    EntityMapper<
      BlacklistSchemaSelect,
      BlacklistedIdentifier,
      BlacklistSchemaInsert
    >
{
  toDomain(raw: BlacklistSchemaSelect): BlacklistedIdentifier {
    return new BlacklistedIdentifier(
      {
        cpfHash: raw.cpfHash,
        reason: raw.reason,
        bannedAt: raw.bannedAt,
      },
      raw.id,
    );
  }

  toPersistence(entity: BlacklistedIdentifier): BlacklistSchemaInsert {
    return {
      id: entity.id,
      cpfHash: entity.cpfHash,
      reason: entity.reason,
    };
  }
}
