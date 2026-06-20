import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t bg-card py-8 text-muted-foreground text-sm">
      <div className="container mx-auto flex flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-foreground">
            Neighborhood Showcase
          </span>
          <p className="max-w-sm text-xs">{t('footer.tagline')}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-medium text-xs">
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
          <Link
            to="/auth"
            search={{ tab: 'signin' }}
            className="transition-colors hover:text-primary"
          >
            {t('menu.login')}
          </Link>
        </nav>

        <p className="text-xs md:text-right">
          &copy; {new Date().getFullYear()} Neighborhood Showcase.
        </p>
      </div>
    </footer>
  );
}
