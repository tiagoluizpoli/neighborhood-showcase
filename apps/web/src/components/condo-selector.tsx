import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronDown } from 'lucide-react';
import { type RouterOutputs, trpc } from '@/utils/trpc';

const LS_KEY = 'mod_ctx__cndo';

type Assignment = RouterOutputs['assignment']['getMyAssignments'][number];
type ModeratorAssignment = Assignment & { condominiumId: string };

function isModeratorWithCondoId(a: Assignment): a is ModeratorAssignment {
  return (
    a.type === 'MODERATOR' &&
    a.status === 'APPROVED' &&
    typeof a.condominiumId === 'string'
  );
}

export function CondoSelector() {
  const queryClient = useQueryClient();

  const { data: assignments, isPending } = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(undefined),
  );

  const moderatorAssignments =
    assignments?.filter(isModeratorWithCondoId) ?? [];

  // Zero assignments → don't render
  if (isPending || moderatorAssignments.length === 0) {
    return null;
  }

  // Determine selected condo
  const stored = localStorage.getItem(LS_KEY);
  const validIds = new Set(moderatorAssignments.map((a) => a.condominiumId));

  let selectedId: string;
  if (stored && validIds.has(stored)) {
    selectedId = stored;
  } else {
    const first = moderatorAssignments[0]?.condominiumId;
    selectedId = first ?? '';
    if (selectedId) localStorage.setItem(LS_KEY, selectedId);
  }

  const selectedAssignment =
    moderatorAssignments.find((a) => a.condominiumId === selectedId) ??
    moderatorAssignments[0];
  const selectedName = selectedAssignment.condominium?.name ?? selectedId;

  function handleSelect(condoId: string) {
    localStorage.setItem(LS_KEY, condoId);
    queryClient.invalidateQueries({
      queryKey: ['assignment.getMyAssignments'],
    });
  }

  // Single condo: display-only, no chevron
  if (moderatorAssignments.length === 1) {
    return (
      <div
        data-condo-selector
        data-condo-selector-trigger
        className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-foreground text-sm"
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{selectedName}</span>
      </div>
    );
  }

  // Multi condos: dropdown selector
  return (
    <div data-condo-selector>
      <Popover>
        <PopoverTrigger
          render={
            <button
              type="button"
              data-condo-selector-trigger
              className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 font-medium text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedName}</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          }
        />
        <PopoverContent
          data-condo-selector-dropdown
          align="start"
          className="w-52 border bg-card p-1"
        >
          <div className="flex flex-col">
            {moderatorAssignments.map((assignment) => {
              const name =
                assignment.condominium?.name ?? assignment.condominiumId;
              const isSelected = assignment.condominiumId === selectedId;
              return (
                <button
                  key={assignment.condominiumId}
                  type="button"
                  onClick={() => handleSelect(assignment.condominiumId)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{name}</span>
                  {isSelected && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
