import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/admin/condominiums')({
  component: AdminCondominiumsPlaceholder,
});

function AdminCondominiumsPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Condomínios</h1>
    </div>
  );
}
