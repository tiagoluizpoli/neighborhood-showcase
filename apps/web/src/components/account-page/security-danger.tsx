import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { AlertTriangle, Loader2, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AccountDangerZoneSectionProps {
  onOpenDelete: () => void;
}

export interface DeleteDialogProps {
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  isOpen: boolean;
  isPending: boolean;
  note: string;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function AccountSecuritySection() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.section_security')}</CardTitle>
        <CardDescription>{t('account.section_security_help')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SecurityCard
          badge={t('account.coming_soon')}
          description={t('account.security_password_desc')}
          title={t('account.security_password')}
        />
        <SecurityCard
          badge={t('account.coming_soon')}
          description={t('account.security_sessions_desc')}
          title={t('account.security_sessions')}
        />
      </CardContent>
    </Card>
  );
}

export function AccountDangerZoneSection({
  onOpenDelete,
}: AccountDangerZoneSectionProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle>{t('account.section_danger_zone')}</CardTitle>
        <CardDescription>
          {t('account.section_danger_zone_help')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-xs/relaxed">
          {t('account.danger_zone_lgpd')}
        </p>
        <Button
          className="w-full"
          onClick={onOpenDelete}
          type="button"
          variant="destructive"
        >
          <UserX className="h-4 w-4" />
          {t('account.button_delete_account')}
        </Button>
      </CardContent>
    </Card>
  );
}

export function DeleteDialog({
  body,
  cancelLabel,
  confirmLabel,
  isOpen,
  isPending,
  note,
  title,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="font-bold text-foreground text-xl">{title}</h2>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          {body}
        </p>
        <p className="mt-2 rounded-xl border border-border bg-muted p-3 text-muted-foreground text-xs leading-relaxed">
          {note}
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SecurityCardProps {
  badge: string;
  description: string;
  title: string;
}

function SecurityCard({ badge, description, title }: SecurityCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
      <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
        {badge}
      </span>
    </div>
  );
}
