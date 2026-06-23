import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@neighborhood-showcase/ui/components/select';
import { Plus, Target, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CTA_TARGET_TYPES = [
  'provider_profile',
  'website',
  'instagram',
  'tiktok',
  'whatsapp',
] as const;
export type CtaTargetType = (typeof CTA_TARGET_TYPES)[number];

export const MAX_SECONDARY_CTA_TARGETS = 3;

export interface CtaTargetView {
  /** Stable client-side id used as a React list key; stripped before the API. */
  id: string;
  type: CtaTargetType;
  value: string | null;
  /** Optional provider-authored button name; falls back to the type word. */
  label: string | null;
}

export interface AnnouncementCtaView {
  primary: CtaTargetView | null;
  secondary: CtaTargetView[];
}

export const EMPTY_CTA_VIEW: AnnouncementCtaView = {
  primary: null,
  secondary: [],
};

export function createCtaTarget(
  type: CtaTargetType = 'provider_profile',
  value: string | null = null,
  label: string | null = null,
): CtaTargetView {
  return { id: crypto.randomUUID(), type, value, label };
}

/** Persisted/DTO CTA shape (no client id) — what the API returns and accepts. */
export interface CtaTargetData {
  type: CtaTargetType;
  value: string | null;
  label?: string | null;
}

export interface AnnouncementCtaData {
  primary: CtaTargetData | null;
  secondary: CtaTargetData[];
}

/**
 * Attach stable client ids to CTA data coming from the API (which has none), so
 * the authoring list can be keyed reliably instead of by array index.
 */
export function withCtaIds(cta: AnnouncementCtaData): AnnouncementCtaView {
  return {
    primary: cta.primary
      ? createCtaTarget(cta.primary.type, cta.primary.value, cta.primary.label)
      : null,
    secondary: cta.secondary.map((target) =>
      createCtaTarget(target.type, target.value, target.label),
    ),
  };
}

const URL_TARGET_TYPES: readonly CtaTargetType[] = [
  'website',
  'instagram',
  'tiktok',
];

export function ctaTargetNeedsUrl(type: CtaTargetType): boolean {
  return URL_TARGET_TYPES.includes(type);
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * A target is "incomplete" when the chosen type still needs a value the author
 * has not supplied (URL targets need a valid URL). Used to gate submission with
 * a clear message before the request reaches the backend contract.
 */
export function isCtaTargetIncomplete(target: CtaTargetView): boolean {
  if (ctaTargetNeedsUrl(target.type)) {
    return !target.value || !isValidHttpUrl(target.value);
  }
  return false;
}

export function ctaHasIncompleteTarget(cta: AnnouncementCtaView): boolean {
  if (cta.primary && isCtaTargetIncomplete(cta.primary)) {
    return true;
  }
  return cta.secondary.some(isCtaTargetIncomplete);
}

interface AnnouncementCtaSectionProps {
  cta: AnnouncementCtaView;
  onChange: (cta: AnnouncementCtaView) => void;
}

export function AnnouncementCtaSection({
  cta,
  onChange,
}: AnnouncementCtaSectionProps) {
  const { t } = useTranslation();

  const setPrimary = (target: CtaTargetView | null) => {
    onChange({ ...cta, primary: target });
  };

  const updateSecondary = (index: number, target: CtaTargetView) => {
    const secondary = cta.secondary.map((existing, i) =>
      i === index ? target : existing,
    );
    onChange({ ...cta, secondary });
  };

  const removeSecondary = (index: number) => {
    onChange({
      ...cta,
      secondary: cta.secondary.filter((_, i) => i !== index),
    });
  };

  const addSecondary = () => {
    if (cta.secondary.length >= MAX_SECONDARY_CTA_TARGETS) {
      return;
    }
    onChange({
      ...cta,
      secondary: [...cta.secondary, createCtaTarget()],
    });
  };

  return (
    <Card data-testid="cta-section">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <CardTitle>{t('new_announcement.cta_card.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('new_announcement.cta_card.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t('new_announcement.cta_card.primary_label')}</Label>
          {cta.primary ? (
            <CtaTargetEditor
              target={cta.primary}
              onChange={setPrimary}
              onRemove={() => setPrimary(null)}
              testIdPrefix="cta-primary"
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrimary(createCtaTarget())}
              className="gap-1.5"
              data-testid="cta-add-primary"
            >
              <Plus className="h-4 w-4" />
              {t('new_announcement.cta_card.add_primary')}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <Label>{t('new_announcement.cta_card.secondary_label')}</Label>
          {cta.secondary.map((target, index) => (
            <CtaTargetEditor
              key={target.id}
              target={target}
              onChange={(next) => updateSecondary(index, next)}
              onRemove={() => removeSecondary(index)}
              testIdPrefix={`cta-secondary-${index}`}
            />
          ))}
          {cta.secondary.length < MAX_SECONDARY_CTA_TARGETS && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSecondary}
              className="gap-1.5 px-0 text-primary"
              data-testid="cta-add-secondary"
            >
              <Plus className="h-4 w-4" />
              {t('new_announcement.cta_card.add_secondary')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CtaTargetEditorProps {
  target: CtaTargetView;
  onChange: (target: CtaTargetView) => void;
  onRemove: () => void;
  testIdPrefix: string;
}

function CtaTargetEditor({
  target,
  onChange,
  onRemove,
  testIdPrefix,
}: CtaTargetEditorProps) {
  const { t } = useTranslation();
  const showValue = target.type !== 'provider_profile';

  return (
    <div
      className="space-y-3 rounded-lg border bg-background p-3"
      data-testid={`${testIdPrefix}-editor`}
    >
      <div className="flex items-center gap-2">
        <Select
          value={target.type}
          onValueChange={(value) => {
            if (value) {
              onChange({
                ...target,
                type: value as CtaTargetType,
                value: null,
              });
            }
          }}
        >
          <SelectTrigger
            className="w-full"
            aria-label={t('new_announcement.cta_card.type_label')}
            data-testid={`${testIdPrefix}-type`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CTA_TARGET_TYPES.map((type) => (
              <SelectItem
                key={type}
                value={type}
                data-testid={`${testIdPrefix}-type-option-${type}`}
              >
                {t(`new_announcement.cta_card.types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 shrink-0 text-muted-foreground"
          data-testid={`${testIdPrefix}-remove`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`${testIdPrefix}-name`}
          className="text-muted-foreground text-xs"
        >
          {t('new_announcement.cta_card.name_label')}
        </Label>
        <Input
          id={`${testIdPrefix}-name`}
          type="text"
          maxLength={40}
          value={target.label ?? ''}
          onChange={(e) =>
            onChange({ ...target, label: e.target.value || null })
          }
          placeholder={t('new_announcement.cta_card.name_placeholder')}
          data-testid={`${testIdPrefix}-name`}
        />
      </div>

      {showValue && (
        <Input
          type={target.type === 'whatsapp' ? 'tel' : 'url'}
          value={target.value ?? ''}
          onChange={(e) => onChange({ ...target, value: e.target.value })}
          placeholder={t(
            `new_announcement.cta_card.value_placeholder.${target.type}`,
          )}
          data-testid={`${testIdPrefix}-value`}
        />
      )}
    </div>
  );
}
