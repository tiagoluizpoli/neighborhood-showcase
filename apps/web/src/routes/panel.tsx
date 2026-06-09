import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@neighborhood-showcase/ui/components/alert-dialog';
import {
  Avatar,
  AvatarFallback,
} from '@neighborhood-showcase/ui/components/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
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
  useNavigate,
} from '@tanstack/react-router';
import {
  Building2,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Store,
  UserCog,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeCycleToggle } from '@/components/theme-cycle-toggle';
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
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  const [sidebarOpen, setSidebarOpen] = React.useState(
    localStorage.getItem('sidebar:state') !== 'false',
  );

  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      onOpenChange={(open) => {
        setSidebarOpen(open);
        localStorage.setItem('sidebar:state', String(open));
      }}
    >
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
                <LayoutDashboard className="mr-2 inline-block h-4 w-4" />
                {t('sidebar.group.provedor')}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/panel/dashboard" />}
                      tooltip={t('sidebar.item.dashboard')}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>{t('sidebar.item.dashboard')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/panel/dashboard/announcements" />}
                      tooltip={t('sidebar.item.meus_anuncios')}
                    >
                      <Megaphone className="h-4 w-4" />
                      <span>{t('sidebar.item.meus_anuncios')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/panel/dashboard/configuration" />}
                      tooltip={t('sidebar.item.configuracoes')}
                    >
                      <Settings className="h-4 w-4" />
                      <span>{t('sidebar.item.configuracoes')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Moderation Group */}
            {hasModeratorRole && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  <ShieldAlert className="mr-2 inline-block h-4 w-4" />
                  {t('sidebar.group.moderacao')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuSub>
                        <SidebarMenuSubButton
                          render={<Link to="/panel/moderation/announcements" />}
                        >
                          <Megaphone className="h-4 w-4" />
                          <span>{t('sidebar.item.anuncios')}</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton
                          render={<Link to="/panel/moderation/residents" />}
                        >
                          <Users className="h-4 w-4" />
                          <span>{t('sidebar.item.moradores')}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Admin Group */}
            {hasSystemManagerRole && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  <ShieldCheck className="mr-2 inline-block h-4 w-4" />
                  {t('sidebar.group.administracao')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuSub>
                        <SidebarMenuSubButton
                          render={<Link to="/panel/admin/overview" />}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>{t('sidebar.item.visao_geral')}</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton
                          render={<Link to="/panel/admin/users" />}
                        >
                          <UserCog className="h-4 w-4" />
                          <span>{t('sidebar.item.usuarios')}</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton
                          render={<Link to="/panel/admin/providers" />}
                        >
                          <Store className="h-4 w-4" />
                          <span>{t('sidebar.item.providers')}</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton
                          render={<Link to="/panel/admin/condominiums" />}
                        >
                          <Building2 className="h-4 w-4" />
                          <span>{t('sidebar.item.condominios')}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Spectrum Group */}
            {isAdministrator && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  <LineChart className="mr-2 inline-block h-4 w-4" />
                  {t('sidebar.group.spectrum')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link to="/panel/spectrum" />}
                        tooltip={t('sidebar.item.spectrum')}
                      >
                        <LineChart className="h-4 w-4" />
                        <span>{t('sidebar.item.spectrum')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
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
                  </button>
                }
              />
              <PopoverContent align="start" className="w-52 border bg-card">
                <div className="flex flex-col gap-1">
                  <Link
                    to="/panel/conta"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {t('sidebar.user_menu.conta')}
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-destructive text-sm transition-colors hover:bg-destructive/10"
                        />
                      }
                    >
                      {t('sidebar.user_menu.sair')}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>
                        {t('sidebar.user_menu.sair')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {session.data?.user?.name} —{' '}
                        {t('sidebar.user_menu.confirm_sair')}
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('sidebar.user_menu.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            authClient.signOut({
                              fetchOptions: {
                                onSuccess: () => {
                                  navigate({ to: '/' });
                                },
                              },
                            });
                          }}
                        >
                          {t('sidebar.user_menu.sair')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </PopoverContent>
            </Popover>
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
            <div className="flex items-center gap-2">
              <ThemeCycleToggle />
              <LanguageSwitcher />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-background p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
