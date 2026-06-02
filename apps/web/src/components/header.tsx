import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ModeToggle } from './mode-toggle';
import UserMenu from './user-menu';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export default function Header() {
  const { data: session } = authClient.useSession();

  const { data: assignments } = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(undefined, {
      enabled: !!session,
    }),
  );

  const hasModeratorRole = !!assignments?.some(
    (a) =>
      a.type === 'MODERATOR' &&
      a.status === 'APPROVED' &&
      a.condominiumId !== null,
  );
  const hasSystemManagerRole = session?.user.role === 'SYSTEM_MANAGER';

  const links = [
    { to: '/' as const, label: 'Início', show: true },
    { to: '/dashboard' as const, label: 'Painel', show: !!session },
    { to: '/moderation' as const, label: 'Moderação', show: hasModeratorRole },
    {
      to: '/admin' as const,
      label: 'Administração',
      show: hasSystemManagerRole,
    },
  ];

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links
            .filter((link) => link.show)
            .map(({ to, label }) => {
              return (
                <Link key={to} to={to}>
                  {label}
                </Link>
              );
            })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
