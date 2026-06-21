import { Button } from '@neighborhood-showcase/ui/components/button';
import { Globe, Instagram, MessageCircle, Target, User } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Public CTA rendering (PRD-v10 / T-17-04). The backend already sanitizes the
 * CTA payload so every target here is resolvable; this module turns the bounded
 * targets into prominent, navigable actions kept visually distinct from the
 * reach-me contact channels. When no CTA exists, callers fall back to contact.
 */

export type CtaTargetType =
  | 'provider_profile'
  | 'website'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp';

export interface CtaTargetView {
  type: CtaTargetType;
  value: string | null;
}

export interface AnnouncementCtaView {
  primary: CtaTargetView | null;
  secondary: CtaTargetView[];
}

export type CtaAnalyticsTarget = 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | null;

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

export function CtaIcon({
  type,
  className = 'h-5 w-5',
}: {
  type: CtaTargetType;
  className?: string;
}) {
  switch (type) {
    case 'provider_profile':
      return <User className={className} />;
    case 'website':
      return <Globe className={className} />;
    case 'instagram':
      return <Instagram className={className} />;
    case 'tiktok':
      return <TiktokIcon className={className} />;
    case 'whatsapp':
      return <MessageCircle className={className} />;
    default:
      return <Target className={className} />;
  }
}

export function ctaActionLabelKey(type: CtaTargetType): string {
  return `announcement_cta.actions.${type}`;
}

export function ctaAnalyticsTarget(type: CtaTargetType): CtaAnalyticsTarget {
  switch (type) {
    case 'whatsapp':
      return 'WHATSAPP';
    case 'instagram':
      return 'INSTAGRAM';
    case 'website':
      return 'WEBSITE';
    default:
      return null;
  }
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ResolveCtaInput {
  target: CtaTargetView;
  providerId: string;
  fallbackWhatsapp?: string;
}

/**
 * Mirror of the domain CTA resolver: turn a bounded target into a navigable
 * href, or null when it cannot resolve to a live destination.
 */
export function resolveCtaHref(input: ResolveCtaInput): string | null {
  const { target, providerId, fallbackWhatsapp } = input;
  switch (target.type) {
    case 'provider_profile':
      return providerId ? `/providers/${providerId}` : null;
    case 'website':
    case 'instagram':
    case 'tiktok':
      return target.value && isValidHttpUrl(target.value) ? target.value : null;
    case 'whatsapp': {
      const explicit = target.value?.replace(/\D/g, '') ?? '';
      const fallback = (fallbackWhatsapp ?? '').replace(/\D/g, '');
      const digits = explicit.length > 0 ? explicit : fallback;
      return digits.length > 0 ? `https://wa.me/${digits}` : null;
    }
    default:
      return null;
  }
}

interface CtaActionLinkProps {
  target: CtaTargetView;
  providerId: string;
  fallbackWhatsapp?: string;
  prominent: boolean;
  onClick?: (analyticsTarget: CtaAnalyticsTarget) => void;
  testId: string;
}

function CtaActionLink({
  target,
  providerId,
  fallbackWhatsapp,
  prominent,
  onClick,
  testId,
}: CtaActionLinkProps) {
  const { t } = useTranslation();
  const href = resolveCtaHref({ target, providerId, fallbackWhatsapp });
  if (!href) {
    return null;
  }

  const internal = target.type === 'provider_profile';
  const label = t(`announcement_cta.actions.${target.type}`);

  return (
    <a
      href={href}
      target={internal ? undefined : '_blank'}
      rel={internal ? undefined : 'noopener noreferrer'}
      onClick={() => onClick?.(ctaAnalyticsTarget(target.type))}
      data-testid={testId}
      data-cta-type={target.type}
    >
      <Button
        className="w-full"
        variant={prominent ? 'default' : 'outline'}
        size={prominent ? 'default' : 'sm'}
      >
        <CtaIcon type={target.type} />
        <span>{label}</span>
      </Button>
    </a>
  );
}

interface AnnouncementCtaActionsProps {
  cta: AnnouncementCtaView;
  providerId: string;
  fallbackWhatsapp?: string;
  onCtaClick?: (analyticsTarget: CtaAnalyticsTarget) => void;
}

/**
 * Detail-surface CTA block: a prominent primary action plus optional secondary
 * targets. Renders nothing when there is no primary CTA so the caller's contact
 * fallback takes over cleanly.
 */
export function AnnouncementCtaActions({
  cta,
  providerId,
  fallbackWhatsapp,
  onCtaClick,
}: AnnouncementCtaActionsProps) {
  const { t } = useTranslation();
  // Attach stable keys once per CTA payload so the secondary list is not keyed
  // by array index.
  const secondaryItems = useMemo(
    () => cta.secondary.map((target) => ({ key: crypto.randomUUID(), target })),
    [cta.secondary],
  );
  if (!cta.primary) {
    return null;
  }

  return (
    <div data-testid="cta-actions">
      <h3 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
        {t('announcement_cta.primary_title')}
      </h3>
      <CtaActionLink
        target={cta.primary}
        providerId={providerId}
        fallbackWhatsapp={fallbackWhatsapp}
        prominent
        onClick={onCtaClick}
        testId="cta-primary-action"
      />

      {cta.secondary.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {secondaryItems.map(({ key, target }, index) => (
            <CtaActionLink
              key={key}
              target={target}
              providerId={providerId}
              fallbackWhatsapp={fallbackWhatsapp}
              prominent={false}
              onClick={onCtaClick}
              testId={`cta-secondary-action-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
