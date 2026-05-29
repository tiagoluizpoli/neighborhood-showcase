import { db } from '@base-fullstack-template/db';
import {
  account as accountSchema,
  session as sessionSchema,
  user as userSchema,
} from '@base-fullstack-template/db/schema/auth';
import { announcement as announcementSchema } from '@base-fullstack-template/db/schema/showcase';
import { eq } from 'drizzle-orm';

export interface DeleteUserAccountInput {
  userId: string;
}

export class DeleteUserAccount {
  async execute(input: DeleteUserAccountInput): Promise<void> {
    const { userId } = input;

    // 1. Scrub User's PII
    // email must be unique and not null, so we use a unique format to prevent conflicts: deleted-${userId}@lgpd.local
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

    // 2. Soft-delete their announcements
    await db
      .update(announcementSchema)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(announcementSchema.providerId, userId));

    // 3. Delete active sessions and oauth accounts to log the user out
    await db.delete(sessionSchema).where(eq(sessionSchema.userId, userId));
    await db.delete(accountSchema).where(eq(accountSchema.userId, userId));
  }
}
