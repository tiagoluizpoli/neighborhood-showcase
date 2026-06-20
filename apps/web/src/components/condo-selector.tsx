import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModerationCondo } from '@/lib/moderation-condo-context';

/**
 * The active-condominium indicator that lives at the top of the Moderation
 * sidebar group. It is deliberately styled apart from the sibling nav items so
 * a moderator immediately recognises it as the place to switch the condo they
 * are working on. Selecting writes to the shared reactive store, which re-syncs
 * every moderation section.
 */
export function CondoSelector({
  variant = 'full',
}: {
  variant?: 'full' | 'icon';
}) {
  const { t } = useTranslation();
  const { assignments, selectedId, selectedName, setSelected } =
    useModerationCondo();

  // Nothing to moderate → render nothing.
  if (assignments.length === 0) {
    return null;
  }

  const label = t('moderation.active_condo');
  const isSwitchable = assignments.length > 1;

  // Condo dropdown body, shared by full and icon variants.
  const dropdown = (
    <PopoverContent
      align="start"
      className="w-60 border bg-card p-1"
      data-condo-selector-dropdown
    >
      <p className="px-2 py-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="flex flex-col">
        {assignments.map((assignment) => {
          const name = assignment.condominium?.name ?? assignment.condominiumId;
          const isSelected = assignment.condominiumId === selectedId;
          return (
            <button
              key={assignment.condominiumId}
              type="button"
              onClick={() => setSelected(assignment.condominiumId)}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{name}</span>
              {isSelected && (
                <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </PopoverContent>
  );

  // Icon variant — collapsed sidebar rail. A square Building2 button tinted as
  // the active-condo accent. Single condo → static indicator; multiple → opens
  // the same dropdown as the full variant.
  if (variant === 'icon') {
    const iconBtn = (
      <span
        className="flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/5"
        title={selectedName}
      >
        <Building2 className="h-5 w-5 shrink-0 text-primary" />
      </span>
    );

    if (!isSwitchable) {
      return (
        <div className="mb-1" data-condo-selector>
          {iconBtn}
        </div>
      );
    }

    return (
      <div className="mb-1" data-condo-selector>
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                data-condo-selector-trigger
                className="rounded-md transition-colors hover:bg-primary/10"
              >
                {iconBtn}
              </button>
            }
          />
          {dropdown}
        </Popover>
      </div>
    );
  }

  // A single-line row matching the sibling sub-item metrics (h-7, px-2,
  // text-xs, -translate-x-px) but tinted and accented so it reads as the
  // group's active-condo indicator rather than just another link.
  const row = (
    <span className="flex h-7 w-full -translate-x-px items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-2 text-left text-xs">
      <Building2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
        {selectedName}
      </span>
      {isSwitchable && (
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </span>
  );

  // Single condo → display-only indicator, not interactive.
  if (!isSwitchable) {
    return (
      <div className="mb-1" data-condo-selector>
        {row}
      </div>
    );
  }

  // Multiple condos → the indicator is a dropdown trigger.
  return (
    <div className="mb-1" data-condo-selector>
      <Popover>
        <PopoverTrigger
          render={
            <button
              type="button"
              data-condo-selector-trigger
              className="w-full rounded-md transition-colors hover:bg-primary/10"
            >
              {row}
            </button>
          }
        />
        {dropdown}
      </Popover>
    </div>
  );
}
