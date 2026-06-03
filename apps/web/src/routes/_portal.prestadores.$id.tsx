import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_portal/prestadores/$id')({
  component: ProviderPublicProfilePlaceholder,
});

function ProviderPublicProfilePlaceholder() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold text-2xl">Perfil do Prestador</h1>
    </div>
  );
}
