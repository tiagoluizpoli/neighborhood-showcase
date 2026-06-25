import { redirect } from '@tanstack/react-router';
import { trpcClient } from '@/utils/trpc';

/**
 * Resolve the provider id a legacy `/panel/provider/...` link (no `$providerId`
 * segment) should redirect into. Uses the existing single-provider contract:
 * `providerProfile.get` with no input resolves the caller's default provider
 * and returns its `providerId`. Returns `null` when the caller owns no usable
 * provider, so the redirect target can fall back to the create flow.
 *
 * Multi-provider selection (the "My Providers" page) lands in T-20-05/ST-02;
 * until then a multi-provider caller without a default resolves to `null` and
 * is routed into the create/setup flow.
 */
export async function resolveDefaultProviderId(): Promise<string | null> {
  try {
    const profile = await trpcClient.providerProfile.get.query();
    return profile.providerId;
  } catch {
    return null;
  }
}

/**
 * `beforeLoad` helper for the legacy (segment-less) `/panel/provider/...`
 * routes. Resolves the caller's default provider id; when none exists it throws
 * a redirect into the create-provider flow so the caller never lands on a
 * provider-scoped page with no active provider. Returns the resolved id so the
 * legacy route can throw its own typed redirect into the `$providerId` variant.
 */
export async function requireDefaultProviderId(): Promise<string> {
  const providerId = await resolveDefaultProviderId();
  if (!providerId) {
    throw redirect({ to: '/panel/provider/condo-setup' });
  }
  return providerId;
}
