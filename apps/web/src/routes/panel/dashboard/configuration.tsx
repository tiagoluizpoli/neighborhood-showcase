import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/dashboard/configuration')({
  component: ConfigurationPlaceholder,
});

function ConfigurationPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Configurações</h1>
    </div>
  );
}
