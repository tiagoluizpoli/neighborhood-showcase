import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/admin/overview')({
  component: AdminOverviewPlaceholder,
});

function AdminOverviewPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Visão Geral</h1>
    </div>
  );
}
