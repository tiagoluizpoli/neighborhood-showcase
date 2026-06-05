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
  useNavigate,
} from '@tanstack/react-router';
import { LayoutDashboard, ShieldAlert, ShieldCheck } from 'lucide-react';
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

  return (
    <SidebarProvider>
      <div
        data-theme="panel"
        className="flex h-svh w-full bg-background text-foreground"
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
                Provedor
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/panel/dashboard" />}
                      tooltip="Dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Moderation Group */}
            {hasModeratorRole && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  Moderação
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link to="/panel/moderation" />}
                        tooltip="Moderação"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Moderação</span>
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
                  Administração
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link to="/panel/admin" />}
                        tooltip="Administração"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Administração</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        {/* Main Panel Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Panel Header */}
          <header className="flex h-14 items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger className="cursor-pointer select-none rounded-full outline-hidden transition-all hover:opacity-90">
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-muted font-semibold text-muted-foreground text-sm">
                      {getInitials(session.data?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 rounded-xl border bg-card p-4"
                  align="end"
                >
                  <div className="flex flex-col gap-1 pb-2">
                    <p className="font-semibold text-foreground text-sm">
                      {session.data?.user?.name}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {session.data?.user?.email}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <div className="flex flex-col gap-1 pt-1">
                    <Link
                      to="/panel/conta"
                      className="flex w-full items-center rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Minha Conta
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        authClient.signOut({
                          fetchOptions: {
                            onSuccess: () => {
                              navigate({ to: '/' });
                            },
                          },
                        });
                      }}
                      className="flex w-full cursor-pointer items-center rounded-lg px-2 py-1.5 text-destructive text-sm transition-colors hover:bg-destructive/10"
                    >
                      Sair
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
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
