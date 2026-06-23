import type { User } from '../entities/user.entity';

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  language: string;
  theme: string;
  emailVerified: boolean;
}

export interface PublicProviderProfileDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  avatarOriginalUrl: string | null;
  companyName: string | null;
  tradeName: string | null;
  logoUrl: string | null;
  logoOriginalUrl: string | null;
  bannerUrl: string | null;
  bannerOriginalUrl: string | null;
  publicDescription: string | null;
  socialLinks: Record<string, string | undefined>;
  status: 'ACTIVE' | 'BANNED';
  deletedAt?: Date | null;
}

export interface ListProvidersRepositoryInput {
  search?: string;
  condominiumId?: string;
  city?: string;
  neighborhood?: string;
}

export interface ListUsersRepositoryInput {
  search?: string;
  role?: 'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR';
  status?: 'ACTIVE' | 'BANNED';
}

export interface UserRepository {
  findProfileById(id: string): Promise<UserProfileDTO | null>;
  findPublicProviderById(id: string): Promise<PublicProviderProfileDTO | null>;
  listProviders(input: ListProvidersRepositoryInput): Promise<User[]>;
  listUsers(input: ListUsersRepositoryInput): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  updateProfile(input: {
    userId: string;
    name?: string;
    image?: string;
    language?: string;
    theme?: string;
    phone?: string;
  }): Promise<void>;
  updateRole(
    id: string,
    role: 'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR',
  ): Promise<User>;
  updateProviderVisibility(id: string, isVisible: boolean): Promise<User>;
  updateStatus(id: string, status: 'ACTIVE' | 'BANNED'): Promise<User>;
  deleteAccountById(userId: string): Promise<void>;
  deleteSessionsAndAccountsByUserId(userId: string): Promise<void>;
  logRoleChange(input: {
    actorId: string;
    targetUserId: string;
    previousRole: string;
    newRole: string;
    condominiumId?: string;
  }): Promise<void>;
}
