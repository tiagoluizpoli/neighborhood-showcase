import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@neighborhood-showcase/ui/components/avatar';
import { Badge } from '@neighborhood-showcase/ui/components/badge';
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
  CheckCircle2,
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

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ''}`.toUpperCase();
};

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

  return (
    <div className="w-full space-y-6 px-4 py-8 lg:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{t('provider_profile.back_to_showcase')}</span>
      </Link>

      {provider.bannerUrl ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-muted">
          <img
            src={provider.bannerUrl}
            alt={`Banner de ${provider.displayName}`}
            className="aspect-video w-full object-cover object-center"
          />
        </section>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {provider.logoUrl ? (
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-3">
                  <img
                    src={provider.logoUrl}
                    alt={`Logo de ${provider.displayName}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <Avatar className="h-24 w-24 border border-border">
                  <AvatarImage src={provider.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xl">
                    {getInitials(provider.displayName)}
                  </AvatarFallback>
                </Avatar>
              )}
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage src={provider.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {getInitials(provider.displayName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold text-3xl text-foreground tracking-tight">
                  {provider.displayName}
                </h1>
                {provider.isVerified ? (
                  <Badge className="gap-1.5 px-3 py-1 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('provider_profile.verified_resident')}
                  </Badge>
                ) : null}
              </div>
              <p className="text-base text-muted-foreground">
                {getIdentityLine(provider.companyName, provider.tradeName)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
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

      <section className="space-y-4">
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
                  className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-muted">
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="h-full w-full object-cover object-center"
                    />
                    {announcement.showVerifiedBadge ? (
                      <Badge className="absolute top-3 left-3 gap-1 rounded-full px-2 py-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Verificado
                      </Badge>
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
    </div>
  );
}
