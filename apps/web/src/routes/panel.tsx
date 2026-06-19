import { useFlag } from '@neighborhood-showcase/feature-flags/client';
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
  AvatarImage,
} from '@neighborhood-showcase/ui/components/avatar';
import { Collapsible } from '@neighborhood-showcase/ui/components/collapsible';
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
  ChevronDown,
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
import { CondoSelector } from '@/components/condo-selector';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeCycleToggle } from '@/components/theme-cycle-toggle';
import { authClient } from '@/lib/auth-client';
import { useUserAccessProfile } from '@/routes/panel/-user-access-profile';
import { trpc } from '@/utils/trpc';

// ---------------------------------------------------------------------------
// Sidebar group collapse state — persisted per group to localStorage
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'sb_grp:';
const MODERATION_CONTEXT_STORAGE_KEY = 'mod_ctx__cndo';

function readGroupOpen(groupKey: string, defaultOpen: boolean): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + groupKey);
    if (stored === null) return defaultOpen;
    return stored === '1';
  } catch {
    return defaultOpen;
  }
}

function writeGroupOpen(groupKey: string, open: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + groupKey, open ? '1' : '0');
  } catch {
    // localStorage unavailable — fail silently
  }
}

// ---------------------------------------------------------------------------
// Sidebar data structure — single source of truth
// ---------------------------------------------------------------------------

type IconComponent = React.ComponentType<{ className?: string }>;

interface SidebarItem {
  i18nKey: string;
  icon: IconComponent;
  href: string;
}

interface SidebarGroupConfig {
  i18nGroupKey: string;
  Icon: IconComponent;
  condition: boolean;
  items: SidebarItem[];
  leadItem?: React.ReactNode;
}

interface SidebarHeaderContext {
  activeGroup: SidebarGroupConfig | null;
  activeItem: SidebarItem | null;
}

// ---------------------------------------------------------------------------
// Named group constants — access by name, never by array index
// ---------------------------------------------------------------------------

const GROUP_PROVEDOR: SidebarGroupConfig = {
  i18nGroupKey: 'sidebar.group.provedor',
  Icon: LayoutDashboard,
  condition: true,
  items: [
    {
      i18nKey: 'sidebar.item.dashboard',
      icon: LayoutDashboard,
      href: '/panel/provider',
    },
    {
      i18nKey: 'sidebar.item.meus_anuncios',
      icon: Megaphone,
      href: '/panel/provider/announcements',
    },
    {
      i18nKey: 'sidebar.item.configuracoes',
      icon: Settings,
      href: '/panel/provider/configuration',
    },
  ],
};

const GROUP_MODERACAO: SidebarGroupConfig = {
  i18nGroupKey: 'sidebar.group.moderacao',
  Icon: ShieldAlert,
  condition: false,
  leadItem: <CondoSelector />,
  items: [
    {
      i18nKey: 'sidebar.item.condominium_info',
      icon: Building2,
      href: '/panel/moderation/condominium',
    },
    {
      i18nKey: 'sidebar.item.anuncios',
      icon: Megaphone,
      href: '/panel/moderation/announcements',
    },
    {
      i18nKey: 'sidebar.item.moradores',
      icon: Users,
      href: '/panel/moderation/residents',
    },
  ],
};

const GROUP_ADMINISTRACAO: SidebarGroupConfig = {
  i18nGroupKey: 'sidebar.group.administracao',
  Icon: ShieldCheck,
  condition: false,
  items: [
    {
      i18nKey: 'sidebar.item.visao_geral',
      icon: LayoutDashboard,
      href: '/panel/admin/overview',
    },
    {
      i18nKey: 'sidebar.item.usuarios',
      icon: UserCog,
      href: '/panel/admin/users',
    },
    {
      i18nKey: 'sidebar.item.providers',
      icon: Store,
      href: '/panel/admin/providers',
    },
    {
      i18nKey: 'sidebar.item.condominios',
      icon: Building2,
      href: '/panel/admin/condominiums',
    },
  ],
};

const GROUP_SPECTRUM: SidebarGroupConfig = {
  i18nGroupKey: 'sidebar.group.spectrum',
  Icon: LineChart,
  condition: false,
  items: [
    {
      i18nKey: 'sidebar.item.spectrum',
      icon: LineChart,
      href: '/panel/spectrum',
    },
  ],
};

function getInitials(name?: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return pathname;
  }
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function pathnameMatches(pathname: string, href: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedHref = normalizePathname(href);

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}

function resolveSidebarHeaderContext(
  pathname: string,
  sidebarGroups: SidebarGroupConfig[],
): SidebarHeaderContext {
  const normalizedPathname = normalizePathname(pathname);
  let activeGroup: SidebarGroupConfig | null = null;
  let activeItem: SidebarItem | null = null;
  let bestMatchLength = -1;

  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (!pathnameMatches(normalizedPathname, item.href)) {
        continue;
      }
      if (item.href.length <= bestMatchLength) {
        continue;
      }
      activeGroup = group;
      activeItem = item;
      bestMatchLength = item.href.length;
    }
  }

  if (activeGroup) {
    return { activeGroup, activeItem };
  }

  if (normalizedPathname.startsWith('/panel/provider')) {
    return {
      activeGroup:
        sidebarGroups.find(
          (group) => group.i18nGroupKey === GROUP_PROVEDOR.i18nGroupKey,
        ) ?? null,
      activeItem: null,
    };
  }

  if (normalizedPathname.startsWith('/panel/moderation')) {
    return {
      activeGroup:
        sidebarGroups.find(
          (group) => group.i18nGroupKey === GROUP_MODERACAO.i18nGroupKey,
        ) ?? null,
      activeItem: null,
    };
  }

  if (normalizedPathname.startsWith('/panel/admin')) {
    return {
      activeGroup:
        sidebarGroups.find(
          (group) => group.i18nGroupKey === GROUP_ADMINISTRACAO.i18nGroupKey,
        ) ?? null,
      activeItem: null,
    };
  }

  if (normalizedPathname.startsWith('/panel/spectrum')) {
    return {
      activeGroup:
        sidebarGroups.find(
          (group) => group.i18nGroupKey === GROUP_SPECTRUM.i18nGroupKey,
        ) ?? null,
      activeItem: null,
    };
  }

  return { activeGroup: null, activeItem: null };
}

// ---------------------------------------------------------------------------
// SidebarGroupSection — renders a single group, optionally collapsible
// ---------------------------------------------------------------------------

function SidebarGroupSection({ group }: { group: SidebarGroupConfig }) {
  const { t } = useTranslation();
  const collapsible = useFlag('sidebar_collapsible_groups');

  // State for collapsible mode — persisted per group to localStorage
  const [open, setOpen] = React.useState<boolean>(() =>
    readGroupOpen(group.i18nGroupKey, true),
  );

  // Always-expanded mode (current behavior when flag is off)
  if (!collapsible) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          <group.Icon className="mr-2 inline-block h-4 w-4" />
          {t(group.i18nGroupKey)}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          {group.leadItem}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuSub>
                {group.items.map((item) => (
                  <SidebarMenuSubButton
                    key={item.i18nKey}
                    render={<Link to={item.href} />}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.i18nKey)}</span>
                  </SidebarMenuSubButton>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Collapsible mode — clicking the label toggles the panel
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        writeGroupOpen(group.i18nGroupKey, next);
      }}
    >
      <SidebarGroup>
        <Collapsible.Trigger
          render={
            <SidebarGroupLabel className="cursor-pointer group-data-[collapsible=icon]:hidden">
              <group.Icon className="mr-2 inline-block h-4 w-4" />
              {t(group.i18nGroupKey)}
              <ChevronDown
                className={
                  'ml-auto h-4 w-4 transition-transform' +
                  (open ? '' : '-rotate-90')
                }
              />
            </SidebarGroupLabel>
          }
        />
        <Collapsible.Panel
          keepMounted
          render={
            <SidebarGroupContent>
              {group.leadItem}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSub>
                    {group.items.map((item) => (
                      <SidebarMenuSubButton
                        key={item.i18nKey}
                        render={<Link to={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.i18nKey)}</span>
                      </SidebarMenuSubButton>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          }
        />
      </SidebarGroup>
    </Collapsible.Root>
  );
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
  const accessProfileQuery = useUserAccessProfile();

  const { data: assignments } = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(undefined, {
      enabled: !!session,
    }),
  );

  const providerEnabled = accessProfileQuery.data?.providerEnabled ?? false;
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
    () => localStorage.getItem('sidebar:state') !== 'false',
  );

  // ---------------------------------------------------------------------------
  // Sidebar groups — conditions resolved from session/assignments at render time
  // ---------------------------------------------------------------------------
  const sidebarGroups: SidebarGroupConfig[] = [
    { ...GROUP_PROVEDOR, condition: providerEnabled },
    { ...GROUP_MODERACAO, condition: hasModeratorRole },
    { ...GROUP_ADMINISTRACAO, condition: hasSystemManagerRole },
    { ...GROUP_SPECTRUM, condition: isAdministrator },
  ];
  const visibleSidebarGroups = sidebarGroups.filter((group) => group.condition);
  const pathname = globalThis.location?.pathname ?? '';
  const activeSidebarContext = resolveSidebarHeaderContext(
    pathname,
    visibleSidebarGroups,
  );
  const moderatorAssignments =
    assignments?.filter(
      (assignment) =>
        assignment.type === 'MODERATOR' &&
        assignment.status === 'APPROVED' &&
        assignment.condominiumId !== null,
    ) ?? [];
  const moderationContextName =
    pathname.startsWith('/panel/moderation') && moderatorAssignments.length > 0
      ? (() => {
          const storedCondominiumId = localStorage.getItem(
            MODERATION_CONTEXT_STORAGE_KEY,
          );
          const selectedAssignment =
            moderatorAssignments.find(
              (assignment) => assignment.condominiumId === storedCondominiumId,
            ) ?? moderatorAssignments[0];
          return (
            selectedAssignment.condominium?.name ??
            selectedAssignment.condominiumId
          );
        })()
      : null;
  const accountLabel = pathnameMatches(pathname, '/panel/account')
    ? t('sidebar.user_menu.account')
    : null;
  const sectionLabel = activeSidebarContext.activeGroup
    ? t(activeSidebarContext.activeGroup.i18nGroupKey)
    : null;
  const pageLabel = activeSidebarContext.activeItem
    ? t(activeSidebarContext.activeItem.i18nKey)
    : accountLabel;
  const sidebarHeaderContext = moderationContextName
    ? moderationContextName
    : pathnameMatches(pathname, '/panel/spectrum')
      ? t('sidebar.spectrum.description')
      : pageLabel && pageLabel !== sectionLabel
        ? pageLabel
        : accountLabel;
  const topBarEyebrow =
    pageLabel && sectionLabel && pageLabel !== sectionLabel
      ? sectionLabel
      : null;
  const topBarTitle = pageLabel ?? sectionLabel;
  const topBarContext = moderationContextName;

  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      open={sidebarOpen}
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
          <SidebarHeader className="flex h-14 items-center gap-3 border-b px-4">
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate font-bold text-sm">
                {t('sidebar.brand.name')}
              </p>
              {sidebarHeaderContext ? (
                <p className="truncate text-muted-foreground text-xs">
                  {sidebarHeaderContext}
                </p>
              ) : null}
            </div>
            <span className="hidden font-bold text-sm group-data-[collapsible=icon]:block">
              {t('sidebar.brand.abbr')}
            </span>
          </SidebarHeader>

          <SidebarContent>
            {visibleSidebarGroups.map((group) => (
              <SidebarGroupSection key={group.i18nGroupKey} group={group} />
            ))}
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
                      <AvatarImage
                        src={session.data?.user?.image ?? undefined}
                        alt={session.data?.user?.name ?? ''}
                      />
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
                    to="/panel/account"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    {t('sidebar.user_menu.account')}
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
                      {t('sidebar.user_menu.logout')}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>
                        {t('sidebar.user_menu.logout')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {session.data?.user?.name} —{' '}
                        {t('sidebar.user_menu.confirm_logout')}
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
                          {t('sidebar.user_menu.logout')}
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
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              {topBarTitle ? (
                <div className="min-w-0">
                  {topBarEyebrow ? (
                    <p className="truncate text-muted-foreground text-xs">
                      {topBarEyebrow}
                    </p>
                  ) : null}
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-semibold text-sm">
                      {topBarTitle}
                    </p>
                    {topBarContext ? (
                      <>
                        <span className="text-muted-foreground text-xs">/</span>
                        <p className="truncate text-muted-foreground text-xs">
                          {topBarContext}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
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
