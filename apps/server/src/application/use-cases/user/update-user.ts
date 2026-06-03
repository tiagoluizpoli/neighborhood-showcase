import { db } from '@neighborhood-showcase/db';
import { user as userSchema } from '@neighborhood-showcase/db/schema/auth';
import { eq } from 'drizzle-orm';

export interface UpdateUserInput {
  userId: string;
  name: string;
}

export class UpdateUser {
  async execute(input: UpdateUserInput): Promise<{ success: boolean }> {
    const { userId, name } = input;
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      throw new Error('Name must be at least 3 characters long');
    }

    await db
      .update(userSchema)
      .set({
        name: trimmedName,
        updatedAt: new Date(),
      })
      .where(eq(userSchema.id, userId));

    return { success: true };
  }
}
