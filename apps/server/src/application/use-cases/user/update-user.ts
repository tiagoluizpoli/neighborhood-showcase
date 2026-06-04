import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface UpdateUserInput {
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
}

export class UpdateUser {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<{ success: boolean }> {
    const { userId, socialLinks, isProviderVisible } = input;
    let { name } = input;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length < 3) {
        throw new Error('Name must be at least 3 characters long');
      }
      name = trimmedName;
    }

    await this.userRepo.updateProfile({
      userId,
      name,
      socialLinks,
      isProviderVisible,
    });

    return { success: true };
  }
}
