import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import type { User } from '../../domain/entities/user.entity';
import type {
  ListProvidersRepositoryInput,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { UserMapper } from './mappers/user.mapper';

export class DrizzleUserRepository implements UserRepository {
  private userMapper = new UserMapper();

  async listProviders(input: ListProvidersRepositoryInput): Promise<User[]> {
    const geoConditions: SQL[] = [];

    if (input.condominiumId) {
      geoConditions.push(
        eq(providerLocationSchema.condominiumId, input.condominiumId),
      );
    }

    if (input.city) {
      geoConditions.push(
        or(
          ilike(condominiumSchema.city, `%${input.city}%`),
          ilike(addressSchema.city, `%${input.city}%`),
        ) as SQL,
      );
    }

    if (input.neighborhood) {
      geoConditions.push(
        ilike(addressSchema.neighborhood, `%${input.neighborhood}%`),
      );
    }

    const qualifiedLocations = await db
      .selectDistinct({ userId: providerLocationSchema.providerId })
      .from(providerLocationSchema)
      .leftJoin(
        addressSchema,
        eq(providerLocationSchema.addressId, addressSchema.id),
      )
      .leftJoin(
        condominiumSchema,
        eq(providerLocationSchema.condominiumId, condominiumSchema.id),
      )
      .where(geoConditions.length > 0 ? and(...geoConditions) : undefined);

    const qualifiedUserIds = qualifiedLocations.map((l) => l.userId);

    if (qualifiedUserIds.length === 0) {
      return [];
    }

    const userConditions: SQL[] = [
      inArray(userSchema.id, qualifiedUserIds),
      eq(userSchema.isProviderVisible, true),
    ];

    if (input.search) {
      const pattern = `%${input.search}%`;
      userConditions.push(
        or(
          ilike(userSchema.name, pattern),
          ilike(userSchema.email, pattern),
        ) as SQL,
      );
    }

    const rows = await db
      .select()
      .from(userSchema)
      .where(and(...userConditions));

    return rows.map((row) => this.userMapper.toDomain(row));
  }
}
