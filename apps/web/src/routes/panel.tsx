import {
  Avatar,
  AvatarFallback,
} from '@neighborhood-showcase/ui/components/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@neighborhood-showcase/ui/components/sidebar';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import {
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

function getInitials(name?: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Route = createFileRoute('/panel')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/',
      });
    }
    return { session };
  },
  component: PanelLayout,
});

function PanelLayout() {
  const { session } = Route.useRouteContext();
  const { t } = useTranslation('sidebar');

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
  const hasSystemManagerRole =
    session?.data?.user.role === 'SYSTEM_MANAGER' ||
    session?.data?.user.role === 'ADMINISTRATOR';
  const isAdministrator = session?.data?.user.role === 'ADMINISTRATOR';

  return (
    <SidebarProvider>
      <div
        data-theme="panel"
        className="flex h-svh w-full bg-background text-foreground [--sidebar-width:280px]"
      >
        <Sidebar collapsible="icon">
          <SidebarHeader className="flex h-14 items-center border-b px-4">
            <span className="truncate font-bold text-sm group-data-[collapsible=icon]:hidden">
              Neighborhood Showcase
            </span>
            <span className="hidden font-bold text-sm group-data-[collapsible=icon]:block">
              NS
            </span>
          </SidebarHeader>

          <SidebarContent>
            {/* Provedor Group */}
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                {t('group.provedor')}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/panel/dashboard" />}
                      tooltip={t('item.dashboard')}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>{t('item.dashboard')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Moderation Group */}
            {hasModeratorRole && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  {t('group.moderacao')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link to="/panel/moderation" />}
                        tooltip={t('group.moderacao')}
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>{t('group.moderacao')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Admin Group */}
            {hasSystemManagerRole && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  {t('group.administracao')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link to="/panel/admin" />}
                        tooltip={t('group.administracao')}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{t('group.administracao')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Spectrum Group */}
            {isAdministrator && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  {t('group.spectrum')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link to="/panel/spectrum" />}
                        tooltip={t('item.spectrum')}
                      >
                        <LineChart className="h-4 w-4" />
                        <span>{t('item.spectrum')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border">
                <AvatarFallback className="bg-muted font-semibold text-muted-foreground text-sm">
                  {getInitials(session.data?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="truncate font-semibold text-foreground text-sm">
                  {session.data?.user?.name}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {session.data?.user?.email}
                </p>
              </div>
              <Link
                to="/panel/conta"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        {/* Main Panel Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Panel Header */}
          <header className="flex h-14 items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4" />
          </header>

          <main className="flex-1 overflow-y-auto bg-background p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
