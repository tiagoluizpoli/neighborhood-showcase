import { Badge } from '@neighborhood-showcase/ui/components/badge';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  ExternalLink,
  Globe,
  Instagram,
  MessageCircle,
  Target,
  User,
} from 'lucide-react';
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
  /** Provider-authored button name; falls back to the type word when empty. */
  label?: string | null;
}

/** Display text for a CTA target: the authored name, else the type word. */
export function ctaDisplayLabel(
  target: CtaTargetView,
  t: (key: string) => string,
): string {
  const named = target.label?.trim();
  return named && named.length > 0
    ? named
    : t(`announcement_cta.actions.${target.type}`);
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
  const label = ctaDisplayLabel(target, t);

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

/**
 * Destination text shown to the provider for a target — the raw saved value, or
 * a descriptive phrase for targets that resolve from other data.
 */
function ctaDestinationText(
  target: CtaTargetView,
  t: (key: string) => string,
): string {
  switch (target.type) {
    case 'provider_profile':
      return t('announcement_cta.summary.profile_destination');
    case 'whatsapp':
      return target.value?.trim()
        ? target.value
        : t('announcement_cta.summary.whatsapp_fallback');
    default:
      return target.value?.trim() ?? '';
  }
}

interface CtaSummaryRowProps {
  target: CtaTargetView;
  providerId: string;
  fallbackWhatsapp?: string;
  roleLabel: string;
  testId: string;
}

function CtaSummaryRow({
  target,
  providerId,
  fallbackWhatsapp,
  roleLabel,
  testId,
}: CtaSummaryRowProps) {
  const { t } = useTranslation();
  const href = resolveCtaHref({ target, providerId, fallbackWhatsapp });
  const internal = target.type === 'provider_profile';

  return (
    <div
      className="space-y-2 rounded-xl border bg-background px-4 py-3"
      data-testid={testId}
      data-cta-type={target.type}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <CtaIcon type={target.type} className="h-3.5 w-3.5" />
          {t(`new_announcement.cta_card.types.${target.type}`)}
        </Badge>
        <Badge variant="secondary">{roleLabel}</Badge>
      </div>
      <div className="grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <span className="text-muted-foreground">
          {t('announcement_cta.summary.name')}
        </span>
        <span className="font-medium text-foreground">
          {target.label?.trim() ? (
            target.label
          ) : (
            <span className="text-muted-foreground italic">
              {t('announcement_cta.summary.no_name')}
            </span>
          )}
        </span>
        <span className="text-muted-foreground">
          {t('announcement_cta.summary.destination')}
        </span>
        <span className="min-w-0 break-words font-medium text-foreground">
          {ctaDestinationText(target, t)}
        </span>
      </div>
      {href && (
        <a
          href={href}
          target={internal ? undefined : '_blank'}
          rel={internal ? undefined : 'noopener noreferrer'}
          className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline"
          data-testid={`${testId}-open`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t('announcement_cta.summary.open')}
        </a>
      )}
    </div>
  );
}

interface AnnouncementCtaSummaryProps {
  cta: AnnouncementCtaView;
  providerId: string;
  fallbackWhatsapp?: string;
}

/**
 * Provider-facing CTA read view. Unlike `AnnouncementCtaActions` (public, sells
 * the click), this surfaces exactly what the provider configured — type, name,
 * destination — as inspectable facts, with an optional link to follow. Renders
 * nothing when no CTA is configured.
 */
export function AnnouncementCtaSummary({
  cta,
  providerId,
  fallbackWhatsapp,
}: AnnouncementCtaSummaryProps) {
  const { t } = useTranslation();
  const secondaryItems = useMemo(
    () => cta.secondary.map((target) => ({ key: crypto.randomUUID(), target })),
    [cta.secondary],
  );

  if (!cta.primary && cta.secondary.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="cta-summary">
      <h2 className="font-semibold text-foreground text-lg">
        {t('announcement_cta.summary.title')}
      </h2>
      <div className="space-y-2">
        {cta.primary && (
          <CtaSummaryRow
            target={cta.primary}
            providerId={providerId}
            fallbackWhatsapp={fallbackWhatsapp}
            roleLabel={t('announcement_cta.summary.primary')}
            testId="cta-summary-primary"
          />
        )}
        {secondaryItems.map(({ key, target }, index) => (
          <CtaSummaryRow
            key={key}
            target={target}
            providerId={providerId}
            fallbackWhatsapp={fallbackWhatsapp}
            roleLabel={t('announcement_cta.summary.secondary')}
            testId={`cta-summary-secondary-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
