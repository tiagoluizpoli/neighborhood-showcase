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
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import {
  type CtaAnalyticsTarget,
  CtaIcon,
  ctaActionLabelKey,
  ctaAnalyticsTarget,
  resolveCtaHref,
} from '@/components/announcement-cta';
import type { RouterOutputs } from '@/utils/trpc';

type PublicAnnouncement = RouterOutputs['announcement']['listPublic'][number];

export interface AnnouncementCardProps {
  ad: PublicAnnouncement;
  selectedCondo?: { id: string; name: string } | null;
  visitorCoords?: { latitude: number; longitude: number } | null;
  isGpsFresh?: boolean;
  hasIpFallback?: boolean;
  onContactClick?: (
    adId: string,
    targetType: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE',
  ) => void;
}

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function AnnouncementCard({
  ad,
  selectedCondo,
  visitorCoords,
  isGpsFresh,
  hasIpFallback,
  onContactClick,
}: AnnouncementCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCardClick = () => {
    navigate({ to: '/anuncios/$id', params: { id: ad.id } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  // 1. Confirmed condominium check
  const isLocal = selectedCondo && ad.condominiumId === selectedCondo.id;

  // 2. Proximity/Location text formatting
  const getLocationText = () => {
    if (isLocal) {
      return 'No seu condomínio';
    }

    if (isGpsFresh && visitorCoords && ad.latitude && ad.longitude) {
      const dist = getDistanceKm(
        visitorCoords.latitude,
        visitorCoords.longitude,
        Number(ad.latitude),
        Number(ad.longitude),
      );
      return `A ${dist.toFixed(1)} km`;
    }

    if (hasIpFallback) {
      return `${t('location.ip_fallback')} (${ad.condoCity})`;
    }

    const baseLoc = ad.condoNeighborhood
      ? `${ad.condoCity} - ${ad.condoNeighborhood}`
      : ad.condoCity;
    return baseLoc;
  };

  // Determine the single primary action. A configured CTA takes priority as the
  // high-importance action; otherwise fall back to the WhatsApp/call contact.
  let contactUrl = '';
  let contactLabel = '';
  let contactIcon: React.ReactNode = null;
  let targetType: CtaAnalyticsTarget = null;

  const ctaPrimary = ad.cta?.primary ?? null;
  const ctaHref = ctaPrimary
    ? resolveCtaHref({
        target: ctaPrimary,
        providerId: ad.providerId,
        fallbackWhatsapp: ad.contactLinks?.whatsapp,
      })
    : null;

  if (ctaPrimary && ctaHref) {
    contactUrl = ctaHref;
    contactLabel = t(ctaActionLabelKey(ctaPrimary.type));
    contactIcon = <CtaIcon type={ctaPrimary.type} className="h-3.5 w-3.5" />;
    targetType = ctaAnalyticsTarget(ctaPrimary.type);
  } else if (ad.contactLinks?.whatsapp) {
    contactUrl = `https://wa.me/${ad.contactLinks.whatsapp.replace(/\D/g, '')}`;
    contactLabel = 'WhatsApp';
    contactIcon = <MessageCircle className="h-3.5 w-3.5" />;
    targetType = 'WHATSAPP';
  } else if (ad.contactLinks?.phone) {
    contactUrl = `tel:${ad.contactLinks.phone.replace(/\D/g, '')}`;
    contactLabel = 'Ligar';
    contactIcon = <Phone className="h-3.5 w-3.5" />;
  } else if (ad.contactLinks?.email) {
    contactUrl = `mailto:${ad.contactLinks.email}`;
    contactLabel = 'Email';
    contactIcon = <Mail className="h-3.5 w-3.5" />;
  }

  const formattedPrice =
    ad.priceCents !== null
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(ad.priceCents / 100)
      : null;

  return (
    <Card
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className="group flex h-full cursor-pointer flex-col overflow-hidden border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* 1. Image section */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {/* Strong status overlays only */}
        {isLocal && (
          <div className="absolute top-3 right-3 rounded bg-success/90 px-2 py-1 font-bold text-[10px] text-success-foreground shadow">
            Aqui no condomínio
          </div>
        )}
      </div>

      <CardHeader className="flex-grow p-4 pb-2">
        {/* 1. Offer-first hierarchy */}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 font-semibold text-base transition-colors group-hover:text-primary">
            {ad.title}
          </CardTitle>
          {formattedPrice && (
            <span className="shrink-0 font-bold text-base text-success">
              {formattedPrice}
            </span>
          )}
        </div>

        {ad.subtitle && (
          <CardDescription className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
            {ad.subtitle}
          </CardDescription>
        )}

        <p className="mt-2 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
          {ad.description}
        </p>

        {/* 2. Category & Location metadata */}
        <div className="mt-3 flex items-center justify-between gap-2 font-medium text-[10px] text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground uppercase tracking-wider">
            {ad.category}
          </span>
          <span className="truncate text-xs">{getLocationText()}</span>
        </div>
      </CardHeader>

      {/* Footer / Identity and Action */}
      <CardContent className="mt-auto p-4 pt-0">
        <hr className="mb-3 border-border/50" />

        <div className="flex items-center justify-between gap-2">
          {/* Provider Identity */}
          <a
            href={`/providers/${ad.providerId}`}
            onClick={(e) => e.stopPropagation()}
            className="group/prov flex min-w-0 items-center gap-2 hover:underline"
          >
            <Avatar size="sm">
              <AvatarImage src={ad.providerAvatarUrl || undefined} />
              <AvatarFallback>{getInitials(ad.providerName)}</AvatarFallback>
            </Avatar>
            <span className="flex items-center gap-1 truncate font-semibold text-foreground text-xs">
              {ad.providerName}
              {ad.showVerifiedBadge && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-current text-primary" />
              )}
            </span>
          </a>

          {/* Contact Action */}
          {contactUrl ? (
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (onContactClick && targetType) {
                  onContactClick(ad.id, targetType);
                }
              }}
              className="shrink-0"
            >
              <Button size="sm" className="h-8">
                {contactIcon}
                <span>{contactLabel}</span>
              </Button>
            </a>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="h-8 shrink-0 text-xs"
            >
              Detalhes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
