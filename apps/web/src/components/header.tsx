import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ModeToggle } from './mode-toggle';
import UserMenu from './user-menu';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export default function Header() {
  const { t, i18n } = useTranslation();
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
    { to: '/' as const, label: t('nav.home'), show: true },
    {
      to: '/panel/dashboard' as const,
      label: t('nav.dashboard'),
      show: !!session,
    },
    {
      to: '/panel/moderation' as const,
      label: t('nav.moderation'),
      show: hasModeratorRole,
    },
    {
      to: '/panel/admin' as const,
      label: t('nav.admin'),
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
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="cursor-pointer rounded border border-input bg-transparent px-2 py-1 text-foreground text-sm outline-none"
          >
            <option value="pt" className="bg-background text-foreground">
              PT
            </option>
            <option value="en" className="bg-background text-foreground">
              EN
            </option>
          </select>
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
