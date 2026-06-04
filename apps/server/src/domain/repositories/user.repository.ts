import type { User } from '../entities/user.entity';

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  socialLinks: Record<string, string | undefined>;
  isProviderVisible: boolean;
}

export interface ListProvidersRepositoryInput {
  search?: string;
  condominiumId?: string;
  city?: string;
  neighborhood?: string;
}

export interface ListUsersRepositoryInput {
  search?: string;
  role?: 'PROVIDER' | 'SYSTEM_MANAGER';
  status?: 'ACTIVE' | 'BANNED';
}

export interface UserRepository {
  findProfileById(id: string): Promise<UserProfileDTO | null>;
  listProviders(input: ListProvidersRepositoryInput): Promise<User[]>;
  listUsers(input: ListUsersRepositoryInput): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  updateProfile(input: {
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
  }): Promise<void>;
  updateRole(id: string, role: 'PROVIDER' | 'SYSTEM_MANAGER'): Promise<User>;
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
