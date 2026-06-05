import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@neighborhood-showcase/ui/components/dialog';
import type { TFunction } from 'i18next';
import { MapPin } from 'lucide-react';
import {
  formatNearbyCondoDistance,
  type NearbyCondoMatch,
  type NearbyCondoSelection,
} from '@/utils/condominium-proximity';

interface PublicVitrineNearbyCondoPromptProps {
  match: NearbyCondoMatch | null;
  onConfirm: (condo: NearbyCondoSelection) => void;
  onDismiss: () => void;
  t: TFunction;
}

export function PublicVitrineNearbyCondoPrompt({
  match,
  onConfirm,
  onDismiss,
  t,
}: PublicVitrineNearbyCondoPromptProps) {
  if (!match) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-lg p-6">
        <DialogHeader className="space-y-2 text-center">
          <div className="mx-auto rounded-full bg-primary/10 p-3 text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <DialogTitle className="font-bold text-xl">
            {match.mode === 'single'
              ? t('location.nearby_single_title', {
                  name: match.condo.name,
                })
              : 'Encontramos condomínios próximos a você'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {match.mode === 'single'
              ? `Detectamos ${formatNearbyCondoDistance(match.distance)} até a entrada principal.`
              : 'Escolha o condomínio que melhor corresponde ao seu endereço para personalizar o feed.'}
          </DialogDescription>
        </DialogHeader>

        {match.mode === 'single' ? (
          <div className="my-4 rounded-xl border bg-muted/40 p-4 text-center">
            <p className="font-medium text-sm">{match.condo.name}</p>
            <p className="mt-1 text-muted-foreground text-xs">
              {match.condo.city} - {match.condo.state}
            </p>
          </div>
        ) : (
          <div className="my-4 max-h-72 space-y-2 overflow-y-auto rounded-xl border bg-muted/20 p-2">
            {match.condos.map((candidate) => (
              <button
                type="button"
                key={candidate.condo.id}
                onClick={() => onConfirm(candidate.condo)}
                className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/60"
              >
                <div>
                  <p className="font-medium text-sm">{candidate.condo.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {candidate.condo.city} - {candidate.condo.state}
                  </p>
                </div>
                <span className="font-semibold text-primary text-xs">
                  {formatNearbyCondoDistance(candidate.distance)}
                </span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="w-full sm:w-auto sm:flex-1"
          >
            Não, continuar sem condomínio
          </Button>
          {match.mode === 'single' ? (
            <Button
              onClick={() => onConfirm(match.condo)}
              className="w-full sm:w-auto sm:flex-1"
            >
              Sim, sou morador(a)
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
