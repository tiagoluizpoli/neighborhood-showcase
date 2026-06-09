import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/admin/users')({
  component: AdminUsersPlaceholder,
});

function AdminUsersPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Usuários</h1>
    </div>
  );
}
