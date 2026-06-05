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

  private async ensureProviderProfile(input: {
    userId: string;
    fallbackName: string;
    fallbackAvatarUrl: string | null;
  }) {
    const [profile] = await db
      .insert(providerProfileSchema)
      .values({
        providerId: input.userId,
        displayName: input.fallbackName,
        avatarUrl: input.fallbackAvatarUrl,
        socialLinks: {},
        isProviderVisible: true,
      })
      .onConflictDoNothing()
      .returning();

    if (profile) {
      return profile;
    }

    const [existing] = await db
      .select()
      .from(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, input.userId))
      .limit(1);

    return existing ?? null;
  }

  async findProfileById(id: string): Promise<UserProfileDTO | null> {
    const [row] = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        phone: userSchema.phone,
        image: userSchema.image,
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

    const profile =
      row.socialLinks !== null && row.isProviderVisible !== null
        ? {
            socialLinks: row.socialLinks,
            isProviderVisible: row.isProviderVisible,
          }
        : await this.ensureProviderProfile({
            userId: row.id,
            fallbackName: row.name,
            fallbackAvatarUrl: row.image ?? null,
          });

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      socialLinks: (profile?.socialLinks ?? {}) as Record<
        string,
        string | undefined
      >,
      isProviderVisible: profile?.isProviderVisible ?? true,
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
        socialLinks: providerProfileSchema.socialLinks,
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

    const profile =
      row.profileName !== null
        ? {
            displayName: row.profileName,
            avatarUrl: row.profileAvatarUrl,
            socialLinks: row.socialLinks,
          }
        : await this.ensureProviderProfile({
            userId: row.id,
            fallbackName: row.fallbackName,
            fallbackAvatarUrl: row.fallbackAvatarUrl ?? null,
          });

    return {
      id: row.id,
      name: profile?.displayName ?? row.fallbackName,
      avatarUrl: profile?.avatarUrl ?? null,
      socialLinks: (profile?.socialLinks ?? {}) as Record<
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

    const profile =
      row.socialLinks !== null && row.isProviderVisible !== null
        ? {
            socialLinks: row.socialLinks,
            isProviderVisible: row.isProviderVisible,
          }
        : await this.ensureProviderProfile({
            userId: row.user.id,
            fallbackName: row.user.name,
            fallbackAvatarUrl: row.user.image ?? null,
          });

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
        socialLinks: (profile?.socialLinks ?? {}) as Record<
          string,
          string | undefined
        >,
        isProviderVisible: profile?.isProviderVisible ?? true,
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
    if (input.name !== undefined) {
      await db
        .update(userSchema)
        .set({
          name: input.name.trim(),
          updatedAt: new Date(),
        })
        .where(eq(userSchema.id, input.userId));
    }

    const [userRow] = await db
      .select({
        name: userSchema.name,
        image: userSchema.image,
      })
      .from(userSchema)
      .where(eq(userSchema.id, input.userId))
      .limit(1);

    if (!userRow) {
      return;
    }

    await db
      .insert(providerProfileSchema)
      .values({
        providerId: input.userId,
        displayName: input.name?.trim() ?? userRow.name,
        avatarUrl: userRow.image ?? null,
        socialLinks: input.socialLinks ?? {},
        isProviderVisible: input.isProviderVisible ?? true,
      })
      .onConflictDoUpdate({
        target: providerProfileSchema.providerId,
        set: {
          displayName:
            input.name?.trim() ?? sql`${providerProfileSchema.displayName}`,
          socialLinks:
            input.socialLinks ?? sql`${providerProfileSchema.socialLinks}`,
          isProviderVisible:
            input.isProviderVisible ??
            sql`${providerProfileSchema.isProviderVisible}`,
          updatedAt: new Date(),
        },
      });
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
