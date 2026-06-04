import type { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import { User } from '../../../domain/entities/user.entity';
import type { EntityMapper } from '../../../domain/mapper';

type UserSchemaSelect = typeof userSchema.$inferSelect;
type UserSchemaInsert = typeof userSchema.$inferInsert;

export class UserMapper
  implements EntityMapper<UserSchemaSelect, User, UserSchemaInsert>
{
  toDomain(raw: UserSchemaSelect): User {
    return new User(
      {
        name: raw.name,
        email: raw.email,
        emailVerified: raw.emailVerified,
        image: raw.image,
        cpfHash: raw.cpfHash,
        role: raw.role,
        status: raw.status,
        phone: raw.phone,
        socialLinks: raw.socialLinks || {},
        isProviderVisible: raw.isProviderVisible,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      raw.id,
    );
  }

  toPersistence(entity: User): UserSchemaInsert {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      emailVerified: entity.emailVerified,
      image: entity.image,
      cpfHash: entity.cpfHash,
      role: entity.role,
      status: entity.status,
      phone: entity.phone,
      socialLinks: entity.socialLinks,
      isProviderVisible: entity.isProviderVisible,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
