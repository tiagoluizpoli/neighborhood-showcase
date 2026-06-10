import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface UpdateUserInput {
  userId: string;
  name?: string;
  image?: string;
  language?: string;
  theme?: string;
  phone?: string;
}

export class UpdateUser {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<{ success: boolean }> {
    let { name } = input;
    const { userId, image, language, theme, phone } = input;

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
      image,
      language,
      theme,
      phone,
    });

    return { success: true };
  }
}
