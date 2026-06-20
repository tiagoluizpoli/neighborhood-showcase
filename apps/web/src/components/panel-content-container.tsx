import type { ReactNode } from 'react';

export type PanelContentContainerVariant =
  | 'default'
  | 'centered-form'
  | 'full-bleed';

interface PanelContentContainerProps {
  variant?: PanelContentContainerVariant;
  children: ReactNode;
}

const variantClasses: Record<PanelContentContainerVariant, string> = {
  default: 'w-full',
  'centered-form': 'mx-auto w-full max-w-2xl',
  // negates the outer panel main's p-6 to reach the scroll-container edges
  'full-bleed': 'w-full -mx-6 -my-6',
};

export function PanelContentContainer({
  variant = 'default',
  children,
}: PanelContentContainerProps) {
  return (
    <div data-container-variant={variant} className={variantClasses[variant]}>
      {children}
    </div>
  );
}
