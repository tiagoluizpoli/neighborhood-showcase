import { Badge } from '@neighborhood-showcase/ui/components/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@neighborhood-showcase/ui/components/tooltip';
import { cn } from '@neighborhood-showcase/ui/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

export type VerifiedResidentStampVariant = 'hero' | 'card';

export interface VerifiedResidentStampProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  condoName: string;
  variant?: VerifiedResidentStampVariant;
}

const stampVariantClassName: Record<VerifiedResidentStampVariant, string> = {
  hero: 'h-7 rounded-full px-3 py-1 text-xs shadow-sm [&>svg]:size-3.5!',
  card: 'h-6 rounded-full px-2.5 py-1 text-[11px] [&>svg]:size-3!',
};

export function VerifiedResidentStamp({
  condoName,
  className,
  variant = 'hero',
  ...props
}: VerifiedResidentStampProps) {
  const { t } = useTranslation();
  const tooltipLabel = t('verified_resident_stamp.label', { condo: condoName });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Badge
              aria-label={tooltipLabel}
              className={cn(
                'inline-flex max-w-full items-center gap-1.5 border border-primary/20 bg-primary/10 text-primary',
                stampVariantClassName[variant],
                className,
              )}
              title={tooltipLabel}
              variant="outline"
              {...props}
            >
              <CheckCircle2
                aria-hidden="true"
                className="shrink-0 fill-current text-primary"
              />
              <span className="truncate">{condoName}</span>
            </Badge>
          }
        />
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
