import { useQuery } from '@tanstack/react-query';
import type { RouterOutputs } from '@/utils/trpc';
import { trpc, trpcClient } from '@/utils/trpc';

export type UserAccessProfile = RouterOutputs['user']['getAccessProfile'];

export async function getUserAccessProfile(): Promise<UserAccessProfile> {
  return await trpcClient.user.getAccessProfile.query();
}

export function useUserAccessProfile() {
  return useQuery(trpc.user.getAccessProfile.queryOptions());
}
