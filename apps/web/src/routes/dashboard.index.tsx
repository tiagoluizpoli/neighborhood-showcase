import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndexComponent,
});

function DashboardIndexComponent() {
  const { session } = Route.useRouteContext();
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div className="space-y-4 p-6">
      <h1 className="font-bold text-3xl">Dashboard</h1>
      <p className="text-slate-300">Welcome {session.data?.user.name}</p>
      <p className="text-slate-400">API: {privateData.data?.message}</p>
    </div>
  );
}
