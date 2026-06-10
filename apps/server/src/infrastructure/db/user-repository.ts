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
  providerAssignment as providerAssignmentSchema,
  providerProfile as providerProfileSchema,
  roleChangeLog as roleChangeLogSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { and, eq, ilike, inArray, or, type SQL, sql } from 'drizzle-orm';
import { User } from '../../domain/entities/user.entity';
import type {
  ListProvidersRepositoryInput,
  ListUsersRepositoryInput,
  PublicProviderProfileDTO,
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
        image: userSchema.image,
        language: userSchema.language,
        theme: userSchema.theme,
        emailVerified: userSchema.emailVerified,
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
      image: row.image ?? null,
      language: row.language,
      theme: row.theme,
      emailVerified: row.emailVerified ?? false,
    };
  }

  async findPublicProviderById(
    id: string,
  ): Promise<PublicProviderProfileDTO | null> {
    const [row] = await db
      .select({
        id: userSchema.id,
        status: userSchema.status,
        deletedAt: userSchema.deletedAt,
        fallbackName: userSchema.name,
        fallbackAvatarUrl: userSchema.image,
        profileName: providerProfileSchema.displayName,
        profileAvatarUrl: providerProfileSchema.avatarUrl,
        companyName: providerProfileSchema.companyName,
        tradeName: providerProfileSchema.tradeName,
        logoUrl: providerProfileSchema.logoUrl,
        bannerUrl: providerProfileSchema.bannerUrl,
        publicDescription: providerProfileSchema.publicDescription,
        socialLinks: providerProfileSchema.socialLinks,
        isProviderVisible: providerProfileSchema.isProviderVisible,
      })
      .from(userSchema)
      .leftJoin(
        providerProfileSchema,
        eq(providerProfileSchema.providerId, userSchema.id),
      )
      .where(eq(userSchema.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    if (row.isProviderVisible === false) {
      return null;
    }

    return {
      id: row.id,
      displayName: row.profileName ?? row.fallbackName,
      avatarUrl: row.profileAvatarUrl ?? row.fallbackAvatarUrl ?? null,
      companyName: row.companyName ?? null,
      tradeName: row.tradeName ?? null,
      logoUrl: row.logoUrl ?? null,
      bannerUrl: row.bannerUrl ?? null,
      publicDescription: row.publicDescription ?? null,
      socialLinks: (row.socialLinks ?? {}) as Record<
        string,
        string | undefined
      >,
      status: row.status,
      deletedAt: row.deletedAt,
    };
  }

  async listProviders(input: ListProvidersRepositoryInput): Promise<User[]> {
    const geoConditions: SQL[] = [];

    if (input.condominiumId) {
      geoConditions.push(
        eq(providerAssignmentSchema.condominiumId, input.condominiumId),
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
      .selectDistinct({ userId: providerAssignmentSchema.providerId })
      .from(providerAssignmentSchema)
      .leftJoin(
        addressSchema,
        eq(providerAssignmentSchema.addressId, addressSchema.id),
      )
      .leftJoin(
        condominiumSchema,
        eq(providerAssignmentSchema.condominiumId, condominiumSchema.id),
      )
      .where(geoConditions.length > 0 ? and(...geoConditions) : undefined);

    const qualifiedUserIds = qualifiedLocations.map((l) => l.userId);

    if (qualifiedUserIds.length === 0) {
      return [];
    }

    const userConditions: SQL[] = [
      inArray(userSchema.id, qualifiedUserIds),
      sql`coalesce(${providerProfileSchema.isProviderVisible}, true) = true`,
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
      .leftJoin(
        providerProfileSchema,
        eq(providerProfileSchema.providerId, userSchema.id),
      )
      .where(and(...userConditions));

    return rows.map(
      ({ user, provider_profile }) =>
        new User(
          {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            cpfHash: user.cpfHash,
            role: user.role,
            status: user.status,
            phone: user.phone,
            socialLinks:
              (provider_profile?.socialLinks as Record<
                string,
                string | undefined
              >) ?? {},
            isProviderVisible: provider_profile?.isProviderVisible ?? true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
          },
          user.id,
        ),
    );
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
      .select({
        user: userSchema,
        socialLinks: providerProfileSchema.socialLinks,
        isProviderVisible: providerProfileSchema.isProviderVisible,
      })
      .from(userSchema)
      .leftJoin(
        providerProfileSchema,
        eq(providerProfileSchema.providerId, userSchema.id),
      )
      .where(eq(userSchema.id, id))
      .limit(1);

    if (!row) return null;

    return new User(
      {
        name: row.user.name,
        email: row.user.email,
        emailVerified: row.user.emailVerified,
        image: row.user.image,
        cpfHash: row.user.cpfHash,
        role: row.user.role,
        status: row.user.status,
        phone: row.user.phone,
        socialLinks: (row.socialLinks ?? {}) as Record<
          string,
          string | undefined
        >,
        isProviderVisible: row.isProviderVisible ?? true,
        createdAt: row.user.createdAt,
        updatedAt: row.user.updatedAt,
        deletedAt: row.user.deletedAt,
      },
      row.user.id,
    );
  }

  async updateProfile(input: {
    userId: string;
    name?: string;
    image?: string;
    language?: string;
    theme?: string;
    phone?: string;
  }): Promise<void> {
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (input.name !== undefined) {
      updates.name = input.name.trim();
    }
    if (input.image !== undefined) {
      updates.image = input.image;
    }
    if (input.language !== undefined) {
      updates.language = input.language;
    }
    if (input.theme !== undefined) {
      updates.theme = input.theme;
    }
    if (input.phone !== undefined) {
      updates.phone = input.phone;
    }

    await db
      .update(userSchema)
      .set(updates)
      .where(eq(userSchema.id, input.userId));
  }

  async updateRole(
    id: string,
    role: 'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR',
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
    const [userRow] = await db
      .select({
        name: userSchema.name,
        image: userSchema.image,
      })
      .from(userSchema)
      .where(eq(userSchema.id, id))
      .limit(1);

    if (!userRow) {
      throw new Error('User not found');
    }

    await db
      .insert(providerProfileSchema)
      .values({
        providerId: id,
        displayName: userRow.name,
        avatarUrl: userRow.image ?? null,
        socialLinks: {},
        isProviderVisible: isVisible,
      })
      .onConflictDoUpdate({
        target: providerProfileSchema.providerId,
        set: {
          isProviderVisible: isVisible,
          updatedAt: new Date(),
        },
      });

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error('User not found');
    }

    return updated;
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

    await db
      .delete(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, userId));

    await this.deleteSessionsAndAccountsByUserId(userId);
  }

  async deleteSessionsAndAccountsByUserId(userId: string): Promise<void> {
    await db.delete(sessionSchema).where(eq(sessionSchema.userId, userId));
    await db.delete(accountSchema).where(eq(accountSchema.userId, userId));
  }
}
