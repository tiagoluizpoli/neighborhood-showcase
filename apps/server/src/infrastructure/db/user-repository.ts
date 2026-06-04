import crypto from 'node:crypto';
import { db } from '@neighborhood-showcase/db';
import {
  account as accountSchema,
  session as sessionSchema,
  user as userSchema,
} from '@neighborhood-showcase/db/schema/auth';
import {
  address as addressSchema,
  announcement as announcementSchema,
  condominium as condominiumSchema,
  providerLocation as providerLocationSchema,
  roleChangeLog as roleChangeLogSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import type { User } from '../../domain/entities/user.entity';
import type {
  ListProvidersRepositoryInput,
  ListUsersRepositoryInput,
  UserProfileDTO,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { UserMapper } from './mappers/user.mapper';

export class DrizzleUserRepository implements UserRepository {
  private userMapper = new UserMapper();

  async findProfileById(id: string): Promise<UserProfileDTO | null> {
    const [row] = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        phone: userSchema.phone,
        socialLinks: userSchema.socialLinks,
        isProviderVisible: userSchema.isProviderVisible,
      })
      .from(userSchema)
      .where(eq(userSchema.id, id))
      .limit(1);

    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      socialLinks: (row.socialLinks ?? {}) as Record<
        string,
        string | undefined
      >,
      isProviderVisible: row.isProviderVisible,
    };
  }

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

  async listUsers(input: ListUsersRepositoryInput): Promise<User[]> {
    const conditions: SQL[] = [];

    if (input.search) {
      const pattern = `%${input.search}%`;
      conditions.push(
        or(
          ilike(userSchema.name, pattern),
          ilike(userSchema.email, pattern),
        ) as SQL,
      );
    }

    if (input.role) {
      conditions.push(eq(userSchema.role, input.role));
    }

    if (input.status) {
      conditions.push(eq(userSchema.status, input.status));
    }

    const rows = await db
      .select()
      .from(userSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return rows.map((row) => this.userMapper.toDomain(row));
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, id))
      .limit(1);

    if (!row) return null;
    return this.userMapper.toDomain(row);
  }

  async updateProfile(input: {
    userId: string;
    name?: string;
    socialLinks?: {
      whatsapp?: string;
      phone?: string;
      email?: string;
      instagram?: string;
      tiktok?: string;
      facebook?: string;
      website?: string;
    };
    isProviderVisible?: boolean;
  }): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }

    if (input.socialLinks !== undefined) {
      updateData.socialLinks = input.socialLinks;
    }

    if (input.isProviderVisible !== undefined) {
      updateData.isProviderVisible = input.isProviderVisible;
    }

    await db
      .update(userSchema)
      .set(updateData)
      .where(eq(userSchema.id, input.userId));
  }

  async updateRole(
    id: string,
    role: 'PROVIDER' | 'SYSTEM_MANAGER',
  ): Promise<User> {
    const [row] = await db
      .update(userSchema)
      .set({ role, updatedAt: new Date() })
      .where(eq(userSchema.id, id))
      .returning();

    if (!row) {
      throw new Error('User not found');
    }
    return this.userMapper.toDomain(row);
  }

  async updateProviderVisibility(
    id: string,
    isVisible: boolean,
  ): Promise<User> {
    const [row] = await db
      .update(userSchema)
      .set({ isProviderVisible: isVisible, updatedAt: new Date() })
      .where(eq(userSchema.id, id))
      .returning();

    if (!row) {
      throw new Error('User not found');
    }
    return this.userMapper.toDomain(row);
  }

  async logRoleChange(input: {
    actorId: string;
    targetUserId: string;
    previousRole: string;
    newRole: string;
    condominiumId?: string;
  }): Promise<void> {
    await db.insert(roleChangeLogSchema).values({
      id: crypto.randomUUID(),
      actorId: input.actorId,
      targetUserId: input.targetUserId,
      previousRole: input.previousRole,
      newRole: input.newRole,
      condominiumId: input.condominiumId || null,
    });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'BANNED'): Promise<User> {
    const [row] = await db
      .update(userSchema)
      .set({ status, updatedAt: new Date() })
      .where(eq(userSchema.id, id))
      .returning();

    if (!row) {
      throw new Error('User not found');
    }
    return this.userMapper.toDomain(row);
  }

  async deleteAccountById(userId: string): Promise<void> {
    await db
      .update(userSchema)
      .set({
        name: 'Anônimo',
        email: `deleted-${userId}@lgpd.local`,
        phone: null,
        cpfHash: null,
        deletedAt: new Date(),
      })
      .where(eq(userSchema.id, userId));

    await db
      .update(announcementSchema)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(announcementSchema.providerId, userId));

    await this.deleteSessionsAndAccountsByUserId(userId);
  }

  async deleteSessionsAndAccountsByUserId(userId: string): Promise<void> {
    await db.delete(sessionSchema).where(eq(sessionSchema.userId, userId));
    await db.delete(accountSchema).where(eq(accountSchema.userId, userId));
  }
}
