import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@neighborhood-showcase/ui/components/avatar';
import { Button } from '@neighborhood-showcase/ui/components/button';
import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@neighborhood-showcase/ui/components/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Facebook,
  Globe,
  Instagram,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
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

export const Route = createFileRoute('/_portal/anuncios/$id')({
  component: PublicAnnouncementDetailsComponent,
});

function PublicAnnouncementDetailsComponent() {
  const { id } = Route.useParams();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { data: session } = authClient.useSession();

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

  // Update page metadata for SEO
  const ad = detailsQuery.data;
  useEffect(() => {
    if (typeof document !== 'undefined' && ad) {
      document.title = `${ad.title} | Neighborhood Showcase`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', ad.description.slice(0, 160));
    }
  }, [ad]);

  const handleContactClick = (
    targetType?: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | null,
  ) => {
    trackEventMutation.mutate({
      announcementId: id,
      eventType: 'CONTACT_CLICK',
      targetType: targetType || null,
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
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a vitrine</span>
        </Link>
        {session && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Denunciar Anúncio"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Denunciar</span>
          </Button>
        )}
      </div>
      <Card className="overflow-hidden border bg-card">
        {/* Cover image 4:3 */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-full w-full object-cover object-center"
          />
          {ad.showVerifiedBadge && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground text-xs">
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
            <div className="mb-6 flex flex-wrap gap-1.5">
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

          {/* Provider Identity Card */}
          <div className="mb-8 rounded-xl border border-muted bg-muted p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  {ad.providerAvatarUrl ? (
                    <AvatarImage
                      src={ad.providerAvatarUrl}
                      alt={ad.providerName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 font-semibold text-base text-primary">
                    {ad.providerName
                      ? ad.providerName.substring(0, 2).toUpperCase()
                      : 'PR'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {ad.providerName}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    Anunciante no Neighborhood Showcase
                  </p>
                </div>
              </div>
              <Link
                to="/providers/$id"
                params={{ id: ad.providerId }}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
              >
                <span>Ver perfil completo</span>
              </Link>
            </div>
          </div>

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
                  <Button className="w-full">
                    <MessageCircle className="h-5 w-5" />
                    Enviar WhatsApp
                  </Button>
                </a>
              )}

              {ad.contactLinks.phone && (
                <a
                  href={`tel:${ad.contactLinks.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick(null)}
                >
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 py-6 font-medium"
                  >
                    <Phone className="h-5 w-5" />
                    Ligar
                  </Button>
                </a>
              )}

              {ad.contactLinks.email && (
                <a
                  href={`mailto:${ad.contactLinks.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick(null)}
                >
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 py-6 font-medium"
                  >
                    <Mail className="h-5 w-5" />
                    Enviar E-mail
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
                    className="flex w-full items-center justify-center gap-2 py-6 font-medium"
                  >
                    <Instagram className="h-5 w-5 text-muted-foreground" />
                    Ver Instagram
                  </Button>
                </a>
              )}

              {ad.contactLinks.tiktok && (
                <a
                  href={`https://tiktok.com/@${ad.contactLinks.tiktok.replace(/@/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick(null)}
                >
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 py-6 font-medium"
                  >
                    <TiktokIcon className="h-5 w-5 text-muted-foreground" />
                    Ver TikTok
                  </Button>
                </a>
              )}

              {ad.contactLinks.facebook && (
                <a
                  href={`https://facebook.com/${ad.contactLinks.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick(null)}
                >
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 py-6 font-medium"
                  >
                    <Facebook className="h-5 w-5 text-muted-foreground" />
                    Ver Facebook
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
                >
                  <Button
                    variant="secondary"
                    className="flex w-full items-center justify-center gap-2 py-6 font-medium"
                  >
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    Acessar Website
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {session && (
        <ReportDialog
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          announcementId={id}
        />
      )}
    </div>
  );
}

function ReportDialog({
  isOpen,
  onClose,
  announcementId,
}: {
  isOpen: boolean;
  onClose: () => void;
  announcementId: string;
}) {
  const [reason, setReason] = useState<
    'FRAUDE_GOLPE' | 'ASSEDIO_OFENSIVO' | 'SPAM' | 'SERVICO_ILEGAL' | 'OUTROS'
  >('FRAUDE_GOLPE');

  const reportMutation = useMutation(
    trpc.announcement.report.mutationOptions({
      onSuccess: () => {
        toast.success(
          'Denúncia enviada com sucesso. Obrigado por nos ajudar a manter a comunidade segura!',
        );
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao enviar denúncia.');
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMutation.mutate({
      announcementId,
      reason,
    });
  };

  const reasons = [
    { value: 'FRAUDE_GOLPE', label: 'Fraude ou Golpe' },
    { value: 'ASSEDIO_OFENSIVO', label: 'Assédio ou Conteúdo Ofensivo' },
    { value: 'SPAM', label: 'Spam' },
    { value: 'SERVICO_ILEGAL', label: 'Serviço Ilegal' },
    { value: 'OUTROS', label: 'Outros' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="font-bold text-foreground text-lg">
            Denunciar Anúncio
          </DialogTitle>
          <DialogDescription className="mt-1 text-muted-foreground text-xs">
            Selecione o motivo da denúncia. Nós revisaremos o anúncio em breve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-3">
            {reasons.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors hover:bg-accent"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="h-4 w-4 border-primary text-primary focus:ring-ring"
                />
                <span className="font-medium text-foreground text-sm">
                  {r.label}
                </span>
              </label>
            ))}
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={reportMutation.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={reportMutation.isPending}
              className="flex-1"
            >
              {reportMutation.isPending ? 'Enviando...' : 'Denunciar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
