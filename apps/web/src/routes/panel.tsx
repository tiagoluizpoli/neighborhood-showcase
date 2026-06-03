import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
import { LayoutDashboard, ShieldAlert, ShieldCheck } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
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
import { trpc } from '@/utils/trpc';

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
  const hasSystemManagerRole = session?.data?.user.role === 'SYSTEM_MANAGER';

  return (
    <SidebarProvider>
      <div data-theme="panel" className="flex h-svh w-full bg-background text-foreground">
        <Sidebar collapsible="icon">
          <SidebarHeader className="flex h-14 items-center px-4 border-b">
            <span className="font-bold text-sm truncate group-data-[collapsible=icon]:hidden">
              Neighborhood Showcase
            </span>
            <span className="font-bold text-sm hidden group-data-[collapsible=icon]:block">
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
                    <SidebarMenuButton render={<Link to="/panel/dashboard" />} tooltip="Dashboard">
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
                      <SidebarMenuButton render={<Link to="/panel/moderation" />} tooltip="Moderação">
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
                      <SidebarMenuButton render={<Link to="/panel/admin" />} tooltip="Administração">
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
          <header className="flex h-14 items-center justify-between border-b bg-card/50 px-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
