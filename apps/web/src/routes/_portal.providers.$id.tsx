import {
  Avatar,
  AvatarFallback,
} from '@neighborhood-showcase/ui/components/avatar';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronLeft,
  Facebook,
  Globe,
  Instagram,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import type { SVGProps } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProviderIdentityHero } from '@/components/provider-identity-hero';
import { VerifiedResidentStamp } from '@/components/verified-resident-stamp';
import { resolveProviderIdentity } from '@/utils/provider-identity';
import { trpc } from '@/utils/trpc';

const TiktokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <title>TikTok</title>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

type SocialLinkKey =
  | 'whatsapp'
  | 'phone'
  | 'email'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'website';

type SocialButtonVariant = 'default' | 'outline' | 'secondary';

interface SocialActionConfig {
  key: SocialLinkKey;
  label: string;
  icon: LucideIcon | typeof TiktokIcon;
  variant: SocialButtonVariant;
  href: (value: string) => string;
}

const SOCIAL_ACTIONS: SocialActionConfig[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    variant: 'default',
    href: (value) => `https://wa.me/${value.replace(/\D/g, '')}`,
  },
  {
    key: 'phone',
    label: 'Ligar',
    icon: Phone,
    variant: 'outline',
    href: (value) => `tel:${value.replace(/\D/g, '')}`,
  },
  {
    key: 'email',
    label: 'Enviar e-mail',
    icon: Mail,
    variant: 'outline',
    href: (value) => `mailto:${value}`,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    variant: 'outline',
    href: (value) => `https://instagram.com/${value.replace(/@/g, '')}`,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: TiktokIcon,
    variant: 'outline',
    href: (value) => `https://tiktok.com/@${value.replace(/@/g, '')}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    variant: 'outline',
    href: (value) =>
      value.startsWith('http') ? value : `https://facebook.com/${value}`,
  },
  {
    key: 'website',
    label: 'Acessar website',
    icon: Globe,
    variant: 'secondary',
    href: (value) => (value.startsWith('http') ? value : `https://${value}`),
  },
];

const getIdentityLine = (
  companyName: string | null,
  tradeName: string | null,
) => {
  if (tradeName && companyName) return `${tradeName} • ${companyName}`;
  return tradeName ?? companyName ?? 'Prestador local';
};

export const Route = createFileRoute('/_portal/providers/$id')({
  component: ProviderPublicProfileComponent,
});

function ProviderPublicProfileComponent() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery(
    trpc.user.getPublicProfile.queryOptions({ id }),
  );

  useEffect(() => {
    if (typeof document === 'undefined' || !data?.provider) return;
    document.title = `${data.provider.displayName} | Neighborhood Showcase`;
    const metaDesc = document.querySelector('meta[name="description"]');
    metaDesc?.setAttribute(
      'content',
      `Veja os anúncios e contatos de ${data.provider.displayName} no Neighborhood Showcase.`,
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          {t('provider_profile.loading')}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-4 py-8 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <ChevronLeft className="h-6 w-6 rotate-180" />
        </div>
        <h2 className="font-bold text-foreground text-xl">
          {t('provider_profile.not_found_title')}
        </h2>
        <p className="max-w-xl text-muted-foreground text-sm">
          {t('provider_profile.not_found_description')}
        </p>
        <Link to="/">
          <Button>{t('provider_profile.back_home')}</Button>
        </Link>
      </div>
    );
  }

  const { announcements, provider } = data;
  const hasSocialLinks = SOCIAL_ACTIONS.some(({ key }) =>
    Boolean(provider.socialLinks?.[key]),
  );

  const { mark } = resolveProviderIdentity({
    logoUrl: provider.logoUrl,
    bannerUrl: provider.bannerUrl,
    name: provider.displayName,
  });

  const identityMark =
    mark.kind === 'logo' ? (
      <div
        data-testid="identity-mark"
        className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-3"
      >
        <img
          src={mark.src}
          alt={t('provider_profile.logo_alt', { name: provider.displayName })}
          className="h-full w-full object-contain"
        />
      </div>
    ) : (
      <Avatar
        data-testid="identity-mark"
        className="h-24 w-24 shrink-0 border border-border"
      >
        <AvatarFallback className="text-xl">{mark.initials}</AvatarFallback>
      </Avatar>
    );

  const verifiedCondoName =
    provider.verifiedCondo?.condoName ??
    (provider.isVerified
      ? (announcements.find((announcement) => announcement.condoName)
          ?.condoName ?? null)
      : null);
  const verifiedBadge = verifiedCondoName ? (
    <>
      <span aria-hidden="true" className="sr-only">
        {t('provider_profile.verified_resident')}
      </span>
      <VerifiedResidentStamp
        condoName={verifiedCondoName}
        data-testid="verified-resident-stamp"
        variant="hero"
      />
    </>
  ) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{t('provider_profile.back_to_showcase')}</span>
      </Link>

      {provider.bannerUrl ? (
        <ProviderIdentityHero
          testId="identity-hero"
          bannerUrl={provider.bannerUrl}
          logoUrl={provider.logoUrl}
          name={provider.displayName}
          identityLine={getIdentityLine(
            provider.companyName,
            provider.tradeName,
          )}
          description={provider.publicDescription}
          bannerBadge={verifiedBadge}
        />
      ) : (
        <section
          data-testid="identity-hero"
          className="relative flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-10 text-center"
        >
          {verifiedBadge ? (
            <div className="absolute top-4 right-4">{verifiedBadge}</div>
          ) : null}
          {identityMark}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h1 className="font-bold text-3xl text-foreground tracking-tight">
                {provider.displayName}
              </h1>
            </div>
            <p className="text-base text-muted-foreground">
              {getIdentityLine(provider.companyName, provider.tradeName)}
            </p>
          </div>
          {provider.publicDescription ? (
            <p className="max-w-xl whitespace-pre-wrap text-muted-foreground text-sm leading-7">
              {provider.publicDescription}
            </p>
          ) : null}
        </section>
      )}

      <section data-testid="announcements-section" className="space-y-4">
        <div>
          <h2 className="font-bold text-2xl text-foreground tracking-tight">
            {t('provider_profile.announcements_title')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('provider_profile.announcements_description')}
          </p>
        </div>

        {announcements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground text-sm">
              {t('provider_profile.announcements_empty')}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {announcements.map((announcement) => {
              const formattedPrice =
                announcement.priceCents === null
                  ? null
                  : new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(announcement.priceCents / 100);

              return (
                <Link
                  key={announcement.id}
                  to="/anuncios/$id"
                  params={{ id: announcement.id }}
                  role="button"
                  className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-muted">
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="h-full w-full object-cover object-center"
                    />
                    {announcement.showVerifiedBadge && verifiedCondoName ? (
                      <VerifiedResidentStamp
                        condoName={verifiedCondoName}
                        variant="card"
                        className="absolute top-3 left-3 bg-background/90"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          {announcement.category}
                        </p>
                        <h3 className="font-semibold text-base text-foreground">
                          {announcement.title}
                        </h3>
                      </div>
                      {formattedPrice ? (
                        <span className="shrink-0 font-bold text-sm text-success">
                          {formattedPrice}
                        </span>
                      ) : null}
                    </div>
                    {announcement.subtitle ? (
                      <p className="text-muted-foreground text-sm">
                        {announcement.subtitle}
                      </p>
                    ) : null}
                    <p className="line-clamp-3 text-muted-foreground text-sm leading-6">
                      {announcement.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {announcement.condominiumId
                        ? `${announcement.condoName} • ${announcement.condoCity}`
                        : `Prestador externo • ${announcement.condoCity}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Card data-testid="contact-section">
        <CardHeader>
          <CardTitle>{t('provider_profile.contact_title')}</CardTitle>
          <CardDescription>
            {t('provider_profile.contact_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSocialLinks ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {SOCIAL_ACTIONS.map(
                ({ href, icon: Icon, key, label, variant }) => {
                  const value = provider.socialLinks?.[key];
                  if (!value) return null;

                  return (
                    <a
                      key={key}
                      href={href(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant={variant}
                        className="w-full justify-start gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </Button>
                    </a>
                  );
                },
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              {t('provider_profile.contact_empty')}
            </p>
          )}
        </CardContent>
      </Card>

      {provider.bannerUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('provider_profile.about_title')}</CardTitle>
            <CardDescription>
              {t('provider_profile.about_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-7">
              {provider.publicDescription ?? t('provider_profile.about_empty')}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
