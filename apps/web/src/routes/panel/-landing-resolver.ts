import { getUserAccessProfile } from './-user-access-profile';
import { trpcClient } from '@/utils/trpc';

interface ResolvePanelLandingParams {
  session: {
    data: {
      user: {
        role?: string | null;
      };
    } | null;
  } | null;
  location: {
    pathname: string;
  };
}

/**
 * Centrally resolves the dashboard/panel landing route based on user roles and access profile.
 * - SYSTEM_MANAGER/ADMINISTRATOR -> /panel/admin
 * - Moderator assignment approved -> /panel/moderation
 * - Provider-enabled -> /panel/provider
 * - Otherwise (no scope) -> /panel/dashboard/condo-setup (fails closed into onboarding)
 */
export async function resolvePanelLanding({
  session,
  location,
}: ResolvePanelLandingParams): Promise<string | null> {
  if (!session?.data) {
    return '/';
  }

  // Legacy condo-setup path is allowed through
  if (location.pathname === '/panel/dashboard/condo-setup') {
    return null;
  }

  const role = session.data.user.role;
  if (role === 'SYSTEM_MANAGER' || role === 'ADMINISTRATOR') {
    return '/panel/admin';
  }

  const assignments = await trpcClient.assignment.getMyAssignments.query();
  const hasModeratorAssignment = assignments.some(
    (a) =>
      a.type === 'MODERATOR' &&
      a.status === 'APPROVED' &&
      a.condominiumId !== null,
  );

  if (hasModeratorAssignment) {
    return '/panel/moderation';
  }

  const accessProfile = await getUserAccessProfile();
  if (accessProfile.providerEnabled) {
    return '/panel/provider';
  }

  // No active section scope — direct to setup onboarding.
  return '/panel/dashboard/condo-setup';
}
