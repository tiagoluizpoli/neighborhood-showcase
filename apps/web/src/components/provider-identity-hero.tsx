import type { ReactNode } from 'react';
import { resolveProviderIdentity } from '@/utils/provider-identity';

/**
 * Banner display aspect. The SAME value feeds the crop dialog (via
 * `useImageCrop`) so the cropped frame is exactly what renders here — no more
 * "crop tool shows a different shape than the page". Kept wide/thin so the
 * banner stays a slim cover bar, not a screen-eating block.
 */
export const BANNER_ASPECT = 8;

export interface ProviderIdentityHeroProps {
  bannerUrl: string | null;
  logoUrl: string | null;
  name: string;
  /** Secondary line, e.g. "Company · Trade name". */
  identityLine?: string | null;
  description?: string | null;
  verifiedBadge?: ReactNode;
  bannerBadge?: ReactNode;
  /** Shown when name is empty (preview placeholder only). */
  namePlaceholder?: string;
  /**
   * Hover-edit overlays (config only). The hero exposes named group scopes
   * `group/banner` and `group/logo`; overlay nodes reveal themselves with
   * `group-hover/banner:` / `group-hover/logo:` utilities.
   */
  bannerEdit?: ReactNode;
  logoEdit?: ReactNode;
  testId?: string;
}

/**
 * The single banner→logo→title identity block — compact by design. Rendered
 * identically by the configuration live preview and the public provider page
 * so what a provider arranges in the preview is exactly what visitors see.
 */
export function ProviderIdentityHero({
  bannerUrl,
  logoUrl,
  name,
  identityLine,
  description,
  verifiedBadge,
  bannerBadge,
  namePlaceholder,
  bannerEdit,
  logoEdit,
  testId,
}: ProviderIdentityHeroProps) {
  const { mark } = resolveProviderIdentity({ logoUrl, bannerUrl, name });

  return (
    <div
      data-testid={testId}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="group/banner relative">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={name}
            className="aspect-[8/1] w-full object-cover object-center"
          />
        ) : (
          <div className="aspect-[8/1] w-full bg-gradient-to-r from-muted to-muted/40" />
        )}
        {bannerBadge ? (
          <div className="absolute top-3 right-3">{bannerBadge}</div>
        ) : null}
        {bannerEdit}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <div className="group/logo relative -mt-8 shrink-0">
          {mark.kind === 'logo' ? (
            <img
              data-testid="identity-mark"
              src={mark.src}
              alt={name}
              className="h-14 w-14 rounded-lg border border-border bg-card object-contain p-1"
            />
          ) : (
            <div
              data-testid="identity-mark"
              className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted font-semibold text-lg text-muted-foreground"
            >
              {mark.initials || '?'}
            </div>
          )}
          {logoEdit}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-semibold text-foreground text-sm">
              {name || namePlaceholder}
            </h1>
            {verifiedBadge}
          </div>
          {identityLine ? (
            <p className="truncate text-muted-foreground text-xs">
              {identityLine}
            </p>
          ) : null}
        </div>
      </div>

      {description ? (
        <p className="line-clamp-2 px-4 pb-3 text-muted-foreground text-xs leading-5">
          {description}
        </p>
      ) : null}
    </div>
  );
}
