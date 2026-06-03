import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import { eq } from 'drizzle-orm';

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
  async execute(input: UpdateUserInput): Promise<{ success: boolean }> {
    const { userId, name, socialLinks, isProviderVisible } = input;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length < 3) {
        throw new Error('Name must be at least 3 characters long');
      }
      updateData.name = trimmedName;
    }

    if (socialLinks !== undefined) {
      updateData.socialLinks = socialLinks;
    }

    if (isProviderVisible !== undefined) {
      updateData.isProviderVisible = isProviderVisible;
    }

    await db
      .update(userSchema)
      .set(updateData)
      .where(eq(userSchema.id, userId));

    return { success: true };
  }
}
