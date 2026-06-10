import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import { useEffect } from 'react';
import { trpc } from '@/utils/trpc';

// Custom SVG Tiktok Icon
const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Route = createFileRoute('/_portal/prestadores/$id')({
  component: ProviderPublicProfileComponent,
});

function ProviderPublicProfileComponent() {
  const { id } = Route.useParams();

  const { data, isLoading, error } = useQuery(
    trpc.user.getPublicProfile.queryOptions({ id }),
  );

  // SEO metadata setup
  useEffect(() => {
    if (typeof document !== 'undefined' && data?.provider) {
      document.title = `${data.provider.displayName} | Neighborhood Showcase`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Veja os anúncios e contatos de ${data.provider.displayName} no Neighborhood Showcase.`,
        );
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Carregando perfil do prestador...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <ChevronLeft className="h-6 w-6 rotate-180" />
        </div>
        <h2 className="font-bold text-foreground text-xl">
          Prestador Não Encontrado
        </h2>
        <p className="text-muted-foreground text-sm">
          O prestador solicitado não existe, foi banido ou teve sua conta
          removida de acordo com a LGPD.
        </p>
        <Link to="/">
          <Button className="mt-2">Voltar para o Início</Button>
        </Link>
      </div>
    );
  }

  const { provider, announcements } = data;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Voltar para a vitrine</span>
        </Link>
      </div>

      {/* Profile Header Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Identity & Social Links Card */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="overflow-hidden border border-border">
            <CardHeader className="flex flex-col items-center border-b pb-6 text-center">
              <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                <AvatarImage src={provider.avatarUrl || undefined} />
                <AvatarFallback className="text-xl">
                  {getInitials(provider.displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <h1 className="font-bold text-foreground text-xl tracking-tight">
                    {provider.displayName}</h1>
                  {provider.isVerified && (
                    <span
                      title="Morador Verificado"
                      className="inline-flex items-center justify-center text-primary"
                    >
                      <CheckCircle2 className="h-5 w-5 fill-current text-primary" />
                    </span>
                  )}
                </div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Prestador Autônomo
                </p>
                {provider.isVerified && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-[10px] text-primary">
                    Morador Verificado
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Canais de Contato
              </h3>
              <div className="flex flex-col gap-3">
                {/* WhatsApp */}
                {provider.socialLinks?.whatsapp && (
                  <a
                    href={`https://wa.me/${provider.socialLinks.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full">
                      <MessageCircle className="h-4.5 w-4.5" />
                      WhatsApp
                    </Button>
                  </a>
                )}

                {/* Phone */}
                {provider.socialLinks?.phone && (
                  <a
                    href={`tel:${provider.socialLinks.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 py-5 font-semibold text-xs"
                    >
                      <Phone className="h-4.5 w-4.5 text-muted-foreground" />
                      Ligar ({provider.socialLinks.phone})
                    </Button>
                  </a>
                )}

                {/* Email */}
                {provider.socialLinks?.email && (
                  <a
                    href={`mailto:${provider.socialLinks.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 py-5 font-semibold text-xs"
                    >
                      <Mail className="h-4.5 w-4.5 text-muted-foreground" />
                      Enviar E-mail
                    </Button>
                  </a>
                )}

                {/* Instagram */}
                {provider.socialLinks?.instagram && (
                  <a
                    href={`https://instagram.com/${provider.socialLinks.instagram.replace(/@/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 py-5 font-semibold text-xs"
                    >
                      <Instagram className="h-4.5 w-4.5 text-muted-foreground" />
                      Instagram
                    </Button>
                  </a>
                )}

                {/* TikTok */}
                {provider.socialLinks?.tiktok && (
                  <a
                    href={`https://tiktok.com/@${provider.socialLinks.tiktok.replace(/@/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 py-5 font-semibold text-xs"
                    >
                      <TiktokIcon className="h-4.5 w-4.5 text-muted-foreground" />
                      TikTok
                    </Button>
                  </a>
                )}

                {/* Facebook */}
                {provider.socialLinks?.facebook && (
                  <a
                    href={
                      provider.socialLinks.facebook.startsWith('http')
                        ? provider.socialLinks.facebook
                        : `https://facebook.com/${provider.socialLinks.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 py-5 font-semibold text-xs"
                    >
                      <Facebook className="h-4.5 w-4.5 text-muted-foreground" />
                      Facebook
                    </Button>
                  </a>
                )}

                {/* Website */}
                {provider.socialLinks?.website && (
                  <a
                    href={
                      provider.socialLinks.website.startsWith('http')
                        ? provider.socialLinks.website
                        : `https://${provider.socialLinks.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="secondary"
                      className="flex w-full items-center justify-center gap-2 py-5 font-semibold text-xs"
                    >
                      <Globe className="h-4.5 w-4.5 text-muted-foreground" />
                      Acessar Website
                    </Button>
                  </a>
                )}

                {/* Fallback if no contact links are configured */}
                {!provider.socialLinks?.whatsapp &&
                  !provider.socialLinks?.phone &&
                  !provider.socialLinks?.email &&
                  !provider.socialLinks?.instagram &&
                  !provider.socialLinks?.tiktok &&
                  !provider.socialLinks?.facebook &&
                  !provider.socialLinks?.website && (
                    <p className="text-center text-muted-foreground text-xs italic">
                      Nenhum canal de contato cadastrado.
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements List Container */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="font-bold text-2xl text-foreground tracking-tight">
              Anúncios Ativos
            </h2>
            <p className="text-muted-foreground text-sm">
              Confira os serviços e listagens oferecidos por este prestador.
            </p>
          </div>

          {announcements.length === 0 ? (
            <Card className="flex flex-col items-center justify-center border border-border border-dashed p-12 text-center">
              <p className="font-medium text-muted-foreground text-sm">
                Este prestador não possui anúncios ativos no momento.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {announcements.map((ad) => {
                const formattedPrice =
                  ad.priceCents !== null
                    ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(ad.priceCents / 100)
                    : null;

                return (
                  <Link
                    key={ad.id}
                    to="/anuncios/$id"
                    params={{ id: ad.id }}
                    className="group flex h-full flex-col overflow-hidden border bg-card"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="h-full w-full object-cover object-center"
                      />
                      {ad.showVerifiedBadge && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary px-2 py-1 font-bold text-[10px] text-primary-foreground">
                          <CheckCircle2 className="h-3 w-3 fill-current" />
                          <span>Verificado</span>
                        </div>
                      )}
                      {!ad.condominiumId && (
                        <div className="absolute top-3 right-3 rounded bg-warning px-2 py-1 font-bold text-[10px] text-warning-foreground">
                          Prestador Externo
                        </div>
                      )}
                    </div>

                    <CardHeader className="flex-grow-0 p-4 pb-2">
                      <div className="mb-1 flex items-center justify-between gap-2 font-medium text-[10px] text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground uppercase tracking-wider">
                          {ad.category}
                        </span>
                        <span className="truncate">
                          {ad.condominiumId ? (
                            `${ad.condoName} (${ad.condoCity})`
                          ) : (
                            <span className="font-semibold text-warning">
                              Autônomo ({ad.condoCity})
                            </span>
                          )}
                        </span>
                      </div>
                      <CardTitle className="line-clamp-1">{ad.title}</CardTitle>
                      {ad.subtitle && (
                        <CardDescription className="line-clamp-1">
                          {ad.subtitle}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="flex flex-grow flex-col justify-between gap-3 p-4 pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="line-clamp-2 pr-2 text-muted-foreground text-xs leading-relaxed">
                          {ad.description}
                        </span>
                        {formattedPrice && (
                          <span className="shrink-0 whitespace-nowrap font-bold text-sm text-success">
                            {formattedPrice}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex flex-col gap-3">
                        <hr className="border-border/50" />

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar size="sm">
                              <AvatarImage
                                src={ad.providerAvatarUrl || undefined}
                              />
                              <AvatarFallback>
                                {getInitials(ad.providerName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex items-center gap-1 truncate font-semibold text-foreground text-xs">
                              {ad.providerName}
                              {ad.showVerifiedBadge && (
                                <CheckCircle2 className="h-3 w-3 fill-current text-primary" />
                              )}
                            </span>
                          </div>

                          {ad.contactLinks?.whatsapp && (
                            <a
                              href={`https://wa.me/${ad.contactLinks.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 rounded-xl bg-success text-success-foreground hover:bg-success/80"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>WhatsApp</span>
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
