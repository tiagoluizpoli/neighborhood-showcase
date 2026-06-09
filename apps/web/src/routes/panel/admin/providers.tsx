import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/admin/providers')({
  component: AdminProvidersPlaceholder,
});

function AdminProvidersPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Providers</h1>
    </div>
  );
}
