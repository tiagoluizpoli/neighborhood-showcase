import { Label } from '@neighborhood-showcase/ui/components/label';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { RouterOutputs } from '@/utils/trpc';
import { trpc } from '@/utils/trpc';

type ProviderProfileData = RouterOutputs['providerProfile']['get'];

interface VisibilitySectionProps {
  profile: ProviderProfileData;
}

const VISIBILITY_DEBOUNCE_MS = 300;

export function VisibilitySection({ profile }: VisibilitySectionProps) {
  const { t } = useTranslation('configuracoes');

  const [isProviderVisible, setIsProviderVisible] = useState(
    profile.isProviderVisible ?? false,
  );
  const [visibilityPending, setVisibilityPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMutation = useMutation(
    trpc.providerProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success(t('toast_success_visibility'));
        setVisibilityPending(false);
      },
      onError: (err) => {
        toast.error(err.message || t('toast_error_generic'));
        setVisibilityPending(false);
      },
    }),
  );

  const handleToggle = () => {
    const newValue = !isProviderVisible;
    setIsProviderVisible(newValue);
    setVisibilityPending(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateMutation.mutate({ isProviderVisible: newValue });
    }, VISIBILITY_DEBOUNCE_MS);
  };

  return (
    <div
      data-testid="visibility-row"
      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
    >
      <div className="space-y-0.5">
        <Label htmlFor="isProviderVisible" className="font-medium text-sm">
          {t('field_isProviderVisible')}
        </Label>
        <p className="text-muted-foreground text-xs">
          {t('field_isProviderVisible_help')}
        </p>
      </div>
      <button
        type="button"
        id="isProviderVisible"
        onClick={handleToggle}
        disabled={visibilityPending || updateMutation.isPending}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-muted-foreground text-sm hover:bg-accent hover:text-foreground disabled:opacity-50"
        title={
          isProviderVisible
            ? t('visibility_toggle_hide')
            : t('visibility_toggle_show')
        }
      >
        {visibilityPending || updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isProviderVisible ? (
          <Eye className="h-4 w-4 text-success" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
        {isProviderVisible ? t('visibility_visible') : t('visibility_hidden')}
      </button>
    </div>
  );
}
