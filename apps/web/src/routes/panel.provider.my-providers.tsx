import { buttonVariants } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2, Plus, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/provider/my-providers')({
  component: MyProvidersPage,
});

function MyProvidersPage() {
  const { t } = useTranslation();
  const providersQuery = useQuery(trpc.providerProfile.listMine.queryOptions());

  if (providersQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">{t('my_providers.loading')}</span>
      </div>
    );
  }

  if (providersQuery.isError || !providersQuery.data) {
    return (
      <div className="space-y-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          {t('my_providers.page_title')}
        </h1>
        <p className="text-destructive text-sm">
          {t('my_providers.load_error')}
        </p>
      </div>
    );
  }

  const providers = providersQuery.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            {t('my_providers.page_title')}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t('my_providers.page_subtitle')}
          </p>
        </div>

        {providers.length > 0 && (
          <Link
            to="/panel/provider/condo-setup"
            className={buttonVariants()}
            data-testid="my-providers-create"
          >
            <Plus className="h-4 w-4" />
            {t('my_providers.create_button')}
          </Link>
        )}
      </div>

      {providers.length === 0 ? (
        <div
          className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-border border-dashed px-6 py-12 text-center"
          data-testid="my-providers-empty"
        >
          <Store className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-semibold text-foreground text-lg">
            {t('my_providers.empty_title')}
          </h2>
          <p className="mt-1 max-w-md text-muted-foreground text-sm">
            {t('my_providers.empty_description')}
          </p>
          <Link
            to="/panel/provider/condo-setup"
            className={buttonVariants({ className: 'mt-5' })}
            data-testid="my-providers-empty-cta"
          >
            <Plus className="h-4 w-4" />
            {t('my_providers.empty_cta')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => {
            const name = provider.displayName ?? t('my_providers.unnamed');

            return (
              <Link
                key={provider.id}
                to="/panel/provider/$providerId"
                params={{ providerId: provider.id }}
                aria-label={t('my_providers.open_card', { name })}
                data-testid={`my-providers-card-${provider.id}`}
                className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {provider.logoUrl ? (
                      <img
                        src={provider.logoUrl}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Store className="h-6 w-6 text-muted-foreground" />
                      </span>
                    )}
                    <CardTitle className="text-base">{name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
