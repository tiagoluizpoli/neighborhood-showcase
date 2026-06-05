import { Button } from '@neighborhood-showcase/ui/components/button';
import { Link } from '@tanstack/react-router';
import type { TFunction } from 'i18next';
import { CheckCircle2, MessageCircle, Search } from 'lucide-react';

interface PublicVitrineMarketingSectionsProps {
  hasSession: boolean;
  t: TFunction;
}

export function PublicVitrineMarketingSections({
  hasSession,
  t,
}: PublicVitrineMarketingSectionsProps) {
  return (
    <>
      <div id="como-funciona" className="mt-16 px-1">
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-6 font-semibold text-lg md:text-xl">
            {t('home.how_it_works.title')}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3 rounded-xl border bg-background px-4 py-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {t('home.how_it_works.step_1_title')}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {t('home.how_it_works.step_1_description')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border bg-background px-4 py-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {t('home.how_it_works.step_2_title')}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {t('home.how_it_works.step_2_description')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border bg-background px-4 py-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {t('home.how_it_works.step_3_title')}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {t('home.how_it_works.step_3_description')}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            {t('home.how_it_works.provider_note')}
          </p>
        </div>
      </div>

      <div
        id="anunciar"
        className="-mx-4 mt-16 border-y bg-muted/30 px-6 py-12 text-center md:-mx-6 md:px-8 lg:-mx-8"
      >
        <div className="mx-auto max-w-3xl">
          <h3 className="mb-2 font-bold text-xl md:text-2xl">
            {t('home.anunciar.title')}
          </h3>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground text-sm md:text-base">
            {t('home.anunciar.description')}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {hasSession ? (
              <Link to="/panel/dashboard">
                <Button variant="default" size="lg">
                  {t('home.anunciar.cta')}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" search={{ tab: 'signup' }}>
                  <Button variant="default" size="lg">
                    {t('home.anunciar.cta')}
                  </Button>
                </Link>
                <Link
                  to="/auth"
                  search={{ tab: 'signin' }}
                  className="font-medium text-primary text-sm hover:underline"
                >
                  {t('home.anunciar.has_account')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
