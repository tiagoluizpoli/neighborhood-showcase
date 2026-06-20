import { redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import {
  isModeratorWithCondoId,
  type ModeratorAssignment,
} from '@/lib/moderation-condo-context';
import { trpcClient } from '@/utils/trpc';

export interface ModeratorRouteContext {
  isSystemManager: boolean;
  moderatorAssignments: ModeratorAssignment[];
}

/**
 * Shared `beforeLoad` guard for every moderation route. Verifies an
 * authenticated session and that the user either manages the system or has at
 * least one approved moderator assignment; otherwise redirects away.
 */
export async function requireModeratorAccess(): Promise<ModeratorRouteContext> {
  const session = await authClient.getSession();
  if (!session.data) {
    throw redirect({ to: '/' });
  }

  const assignments = await trpcClient.assignment.getMyAssignments.query();
  const moderatorAssignments = assignments.filter(isModeratorWithCondoId);

  const role = session.data.user.role;
  const isSystemManager = role === 'SYSTEM_MANAGER' || role === 'ADMINISTRATOR';

  if (!isSystemManager && moderatorAssignments.length === 0) {
    throw redirect({ to: '/panel/dashboard' });
  }

  return { isSystemManager, moderatorAssignments };
}
