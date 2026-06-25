import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { ActiveProviderIdProvider } from './panel/provider/-active-provider-context';
import { requireDefaultProviderId } from './panel/provider/-resolve-active-provider';
import { trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/panel/provider/$providerId')({
  beforeLoad: async ({ params }) => {
    // Provider-scoped ownership gate. The server enforces ownership/standing
    // (T-20-04) on every provider procedure, but a deep-link to a provider the
    // caller does not own should redirect rather than render a broken page.
    // `providerProfile.get` resolves only providers owned by the caller, so a
    // throw means "not owned / not found": bounce to the caller's default
    // provider (or the create flow when they own none).
    try {
      await trpcClient.providerProfile.get.query({
        providerId: params.providerId,
      });
    } catch {
      const fallbackProviderId = await requireDefaultProviderId();
      throw redirect({
        to: '/panel/provider/$providerId',
        params: { providerId: fallbackProviderId },
      });
    }
  },
  component: ActiveProviderLayout,
});

function ActiveProviderLayout() {
  const { providerId } = Route.useParams();

  return (
    <ActiveProviderIdProvider providerId={providerId}>
      <Outlet />
    </ActiveProviderIdProvider>
  );
}
