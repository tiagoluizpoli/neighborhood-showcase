import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';

export function Header() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();

  return (
    <header className="border-b bg-card text-card-foreground">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <Link to="/" className="font-bold text-primary text-xl tracking-tight">
          Neighborhood Showcase
        </Link>

        {/* Public Navigation */}
        <nav className="hidden items-center gap-6 font-medium text-sm md:flex">
          <Link
            to="/"
            hash="explorar"
            className="transition-colors hover:text-primary"
          >
            {t('nav.explore')}
          </Link>
          <Link
            to="/"
            hash="como-funciona"
            className="transition-colors hover:text-primary"
          >
            {t('nav.how_it_works')}
          </Link>
          <Link
            to="/"
            hash="anunciar"
            className="transition-colors hover:text-primary"
          >
            {t('nav.advertise')}
          </Link>
        </nav>

        <div className="flex items-center">
          {session ? (
            <Link
              to="/panel/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow transition-colors hover:bg-primary/90"
            >
              {t('nav.dashboard')}
            </Link>
          ) : (
            <Link
              to="/auth"
              search={{ tab: 'signin' }}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t('menu.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
