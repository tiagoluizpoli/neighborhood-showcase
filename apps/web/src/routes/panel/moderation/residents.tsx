import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/moderation/residents')({
  component: ModerationResidentsPlaceholder,
});

function ModerationResidentsPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Moradores</h1>
    </div>
  );
}
