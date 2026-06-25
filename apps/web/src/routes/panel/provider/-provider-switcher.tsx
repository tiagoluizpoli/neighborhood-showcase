import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Check, ChevronsUpDown, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/utils/trpc';

/**
 * The owner-facing summary the switcher renders per provider. Mirrors the
 * `providerProfile.listMine` payload (`OwnedProviderSummary`) but is declared
 * locally so the presentational `ProviderSwitcherItems` has a named prop type
 * (no inline object types).
 */
export interface ProviderSwitcherProvider {
  id: string;
  displayName: string | null;
  logoUrl: string | null;
}

export interface ProviderSwitcherItemsProps {
  providers: ProviderSwitcherProvider[];
  activeProviderId: string | null;
}

/**
 * The dropdown body — one navigation `Link` per owned provider plus a link into
 * the full My Providers page. Selecting a provider is just navigation into its
 * `$providerId` route (the active provider is URL-derived, never stored), so the
 * switcher needs no client state. Extracted from the Popover wrapper so it can
 * be unit-tested directly without opening the portal.
 */
export function ProviderSwitcherItems({
  providers,
  activeProviderId,
}: ProviderSwitcherItemsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col" data-provider-switcher-items>
      <p className="px-2 py-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
        {t('provider_switcher.label')}
      </p>
      {providers.map((provider) => {
        const name = provider.displayName ?? t('my_providers.unnamed');
        const isActive = provider.id === activeProviderId;

        return (
          <Link
            key={provider.id}
            to="/panel/provider/$providerId"
            params={{ providerId: provider.id }}
            data-testid={`provider-switcher-item-${provider.id}`}
            data-active={isActive ? 'true' : undefined}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt=""
                className="h-5 w-5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate text-left">{name}</span>
            {isActive && (
              <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
            )}
          </Link>
        );
      })}
      <Link
        to="/panel/provider/my-providers"
        data-testid="provider-switcher-manage"
        className="mt-1 flex items-center gap-2 rounded-md border-t px-2 py-2 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {t('provider_switcher.manage')}
      </Link>
    </div>
  );
}

export interface ProviderSwitcherProps {
  activeProviderId: string | null;
}

/**
 * Persistent panel-header provider switcher. Lists every provider the caller
 * owns (`providerProfile.listMine`) and reflects the active provider — derived
 * from the `$providerId` URL segment (`activeProviderId`) — in the trigger
 * label. Selecting a provider navigates into its `$providerId` route. Renders
 * nothing when the caller owns no providers, so it is inert for non-provider
 * users and on the zero-provider state (handled by the My Providers page).
 */
export function ProviderSwitcher({ activeProviderId }: ProviderSwitcherProps) {
  const { t } = useTranslation();
  const providersQuery = useQuery(trpc.providerProfile.listMine.queryOptions());
  const providers: ProviderSwitcherProvider[] = providersQuery.data ?? [];

  if (providers.length === 0) {
    return null;
  }

  const active = providers.find((p) => p.id === activeProviderId) ?? null;
  const triggerLabel = active
    ? (active.displayName ?? t('my_providers.unnamed'))
    : t('provider_switcher.select');

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            data-testid="provider-switcher-trigger"
            aria-label={t('provider_switcher.aria')}
            className="flex h-9 min-w-0 max-w-[220px] items-center gap-2 rounded-md border bg-card px-2.5 text-sm transition-colors hover:bg-accent"
          >
            <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-left font-medium">
              {triggerLabel}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent
        align="start"
        className="w-64 border bg-card p-1"
        data-provider-switcher-dropdown
      >
        <ProviderSwitcherItems
          providers={providers}
          activeProviderId={activeProviderId}
        />
      </PopoverContent>
    </Popover>
  );
}
