import { Button } from '@neighborhood-showcase/ui/components/button';
import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  Instagram,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/anuncios/$id')({
  component: PublicAnnouncementDetailsComponent,
});

function PublicAnnouncementDetailsComponent() {
  const { id } = Route.useParams();

  // Query details
  const detailsQuery = useQuery(
    trpc.announcement.getPublic.queryOptions({ id }),
  );

  // Mutation for tracking events
  const trackEventMutation = useMutation(
    trpc.announcement.trackEvent.mutationOptions(),
  );
  const { mutate: trackEvent } = trackEventMutation;

  // Track impression on load
  const hasTracked = useRef<string | null>(null);
  useEffect(() => {
    if (detailsQuery.data && hasTracked.current !== id) {
      hasTracked.current = id;
      trackEvent({
        announcementId: id,
        eventType: 'IMPRESSION',
      });
    }
  }, [id, detailsQuery.data, trackEvent]);

  const handleContactClick = (
    targetType: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE',
  ) => {
    trackEventMutation.mutate({
      announcementId: id,
      eventType: 'CONTACT_CLICK',
      targetType,
    });
  };

  if (detailsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Carregando detalhes do anúncio...
        </p>
      </div>
    );
  }

  const ad = detailsQuery.data;

  if (!ad) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-12 text-center">
        <h2 className="mb-2 font-semibold text-2xl">Anúncio não encontrado</h2>
        <p className="mb-6 text-muted-foreground">
          Este anúncio não existe ou foi pausado pelo anunciante.
        </p>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a vitrine
          </Button>
        </Link>
      </div>
    );
  }

  const formattedPrice =
    ad.priceCents !== null && ad.priceCents !== undefined
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(ad.priceCents / 100)
      : null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para a vitrine</span>
      </Link>

      <Card className="overflow-hidden border bg-card/50 shadow-lg backdrop-blur-sm">
        {/* Cover image 4:3 */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
          />
          {ad.showVerifiedBadge && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-primary/95 px-3 py-1.5 font-semibold text-primary-foreground text-xs shadow-md">
              <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
              <span>Morador Verificado</span>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {/* Category & Condo Info */}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
              {ad.category}
            </span>
            <span>•</span>
            <span>
              {ad.condominiumId ? (
                `${ad.condoName} (${ad.condoCity} - ${ad.condoState})`
              ) : (
                <span className="font-semibold text-warning">
                  Prestador Externo ({ad.condoCity} - {ad.condoState})
                </span>
              )}
            </span>
          </div>

          {/* Title & Price */}
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-bold text-2xl tracking-tight">{ad.title}</h1>
              {ad.subtitle && (
                <p className="mt-1 text-muted-foreground text-sm">
                  {ad.subtitle}
                </p>
              )}
            </div>
            {formattedPrice && (
              <span className="whitespace-nowrap font-bold text-success text-xl">
                {formattedPrice}
              </span>
            )}
          </div>

          <hr className="my-4 border-muted" />

          {/* Description */}
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Descrição
            </h3>
            <p className="whitespace-pre-line text-foreground text-sm leading-relaxed">
              {ad.description}
            </p>
          </div>

          {ad.tags && ad.tags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-1.5">
              {ad.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted/65 px-2 py-0.5 text-muted-foreground text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Contact Actions */}
          <div>
            <h3 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Contatar Anunciante
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {ad.contactLinks.whatsapp && (
                <a
                  href={`https://wa.me/${ad.contactLinks.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick('WHATSAPP')}
                >
                  <Button className="flex w-full items-center justify-center gap-2 bg-success py-6 font-medium text-success-foreground hover:bg-success/80">
                    <MessageCircle className="h-5 w-5" />
                    Enviar WhatsApp
                  </Button>
                </a>
              )}

              {ad.contactLinks.instagram && (
                <a
                  href={`https://instagram.com/${ad.contactLinks.instagram.replace(/@/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick('INSTAGRAM')}
                >
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 border-pink-500/30 py-6 font-medium hover:bg-pink-50/10"
                  >
                    <Instagram className="h-5 w-5 text-pink-500" />
                    Ver Instagram
                  </Button>
                </a>
              )}

              {ad.contactLinks.website && (
                <a
                  href={
                    ad.contactLinks.website.startsWith('http')
                      ? ad.contactLinks.website
                      : `https://${ad.contactLinks.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick('WEBSITE')}
                  className="sm:col-span-2"
                >
                  <Button
                    variant="secondary"
                    className="flex w-full items-center justify-center gap-2 py-6 font-medium"
                  >
                    <Globe className="h-5 w-5 text-blue-500" />
                    Acessar Website
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
