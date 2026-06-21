import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: mock state mirrors API payloads
let mockSession: any = null;
// biome-ignore lint/suspicious/noExplicitAny: mock state mirrors API payloads
let mockAssignments: any[] = [];
// biome-ignore lint/suspicious/noExplicitAny: mock state mirrors API payloads
let mockAccessProfile: any = { providerEnabled: false };

// Sidebar primitives are stubbed (render children) and useSidebar is forced to
// the expanded desktop state so the full labelled groups render — the test owns
// the panel's group-visibility logic, not the sidebar primitive.
mock.module('@neighborhood-showcase/ui/components/sidebar', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarProvider: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  Sidebar: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarContent: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarFooter: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarGroup: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarGroupContent: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarGroupLabel: ({ children }: any) => <div>{children}</div>,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarHeader: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarMenu: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarMenuButton: (props: any) =>
    props.render ?? <button type="button">{props.children}</button>,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarMenuItem: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarMenuSub: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarMenuSubItem: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  SidebarMenuSubButton: (props: any) => props.render ?? null,
  SidebarRail: () => null,
  SidebarSeparator: () => null,
  SidebarTrigger: () => null,
  useSidebar: () => ({ state: 'expanded', isMobile: false }),
}));

mock.module('@/components/condo-selector', () => ({
  CondoSelector: () => null,
}));
mock.module('@/components/theme-cycle-toggle', () => ({
  ThemeCycleToggle: () => null,
}));
mock.module('@/components/language-switcher', () => ({
  LanguageSwitcher: () => null,
}));
mock.module('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'system', setTheme: () => {} }),
}));

mock.module('@neighborhood-showcase/ui/components/popover', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  Popover: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  PopoverTrigger: (props: any) => props.render ?? null,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  PopoverContent: ({ children }: any) => children,
}));
mock.module('@neighborhood-showcase/ui/components/avatar', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  Avatar: ({ children }: any) => children,
  AvatarImage: () => null,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  AvatarFallback: ({ children }: any) => children,
}));

mock.module('@/lib/auth-client', () => ({
  authClient: {
    getSession: () => ({ data: mockSession?.data ?? null }),
    useSession: () => ({ data: mockSession?.data ?? null, isPending: false }),
    signOut: () => {},
  },
}));

mock.module('@/utils/trpc', () => ({
  trpc: {
    assignment: {
      getMyAssignments: {
        queryOptions: () => ({
          queryKey: ['getMyAssignments'],
          queryFn: async () => mockAssignments,
          initialData: mockAssignments,
        }),
      },
    },
    user: {
      getAccessProfile: {
        queryOptions: () => ({
          queryKey: ['getAccessProfile'],
          queryFn: async () => mockAccessProfile,
          initialData: mockAccessProfile,
        }),
      },
    },
  },
  trpcClient: {
    user: {
      getAccessProfile: { query: async () => mockAccessProfile },
    },
  },
}));

const { Route } = await import('@/routes/panel');
Route.useRouteContext = (() => ({
  session: mockSession,
})) as typeof Route.useRouteContext;

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = Route.options.component as () => JSX.Element;
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const groupShown = (label: string) => screen.queryAllByText(label).length > 0;

describe('Panel Layout Visibility Tests', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    mockSession = null;
    mockAssignments = [];
    mockAccessProfile = { providerEnabled: false };
    localStorage.clear();
    globalThis.location.href = 'http://localhost/panel';
  });

  const session = (role: string) => ({
    data: { user: { id: 'u', name: 'U', email: 'u@e.com', role } },
  });

  test('plain USER with no assignments sees no moderator, admin, or spectrum groups', () => {
    mockSession = session('USER');
    renderPanel();
    expect(groupShown('Moderação')).toBe(false);
    expect(groupShown('Administração')).toBe(false);
    expect(groupShown('Spectrum')).toBe(false);
    expect(groupShown('Provedor')).toBe(false);
  });

  test('RESIDENT with approved assignment sees only Provedor group', () => {
    mockSession = session('USER');
    mockAssignments = [
      {
        id: 'a1',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'RESIDENT',
        status: 'APPROVED',
      },
    ];
    mockAccessProfile = { providerEnabled: true };
    renderPanel();
    expect(groupShown('Provedor')).toBe(true);
    expect(groupShown('Moderação')).toBe(false);
    expect(groupShown('Administração')).toBe(false);
    expect(groupShown('Spectrum')).toBe(false);
  });

  test('MODERATOR with approved assignment sees Moderação group', () => {
    mockSession = session('USER');
    mockAssignments = [
      {
        id: 'a1',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ];
    renderPanel();
    expect(groupShown('Moderação')).toBe(true);
    expect(groupShown('Provedor')).toBe(false);
    expect(groupShown('Administração')).toBe(false);
    expect(groupShown('Spectrum')).toBe(false);
  });

  test('SYSTEM_MANAGER sees Administração group', () => {
    mockSession = session('SYSTEM_MANAGER');
    renderPanel();
    expect(groupShown('Administração')).toBe(true);
    expect(groupShown('Provedor')).toBe(false);
    expect(groupShown('Spectrum')).toBe(false);
  });

  test('ADMINISTRATOR sees Spectrum group (Moderação requires moderator assignment)', () => {
    mockSession = session('ADMINISTRATOR');
    renderPanel();
    expect(groupShown('Provedor')).toBe(false);
    expect(groupShown('Administração')).toBe(true);
    expect(groupShown('Spectrum')).toBe(true);
    expect(groupShown('Moderação')).toBe(false);
  });

  test('ADMINISTRATOR with moderator assignment sees all four except Provedor', () => {
    mockSession = session('ADMINISTRATOR');
    mockAssignments = [
      {
        id: 'a1',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ];
    renderPanel();
    expect(groupShown('Provedor')).toBe(false);
    expect(groupShown('Moderação')).toBe(true);
    expect(groupShown('Administração')).toBe(true);
    expect(groupShown('Spectrum')).toBe(true);
  });

  test('provider announcement route chrome shows provider section context', () => {
    mockSession = session('USER');
    mockAssignments = [
      {
        id: 'a1',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'RESIDENT',
        status: 'APPROVED',
      },
    ];
    mockAccessProfile = { providerEnabled: true };
    globalThis.location.href = 'http://localhost/panel/provider/announcements';

    const { container } = renderPanel();
    const topBar = container.querySelector('header');
    expect(topBar).not.toBeNull();
    expect(topBar?.textContent).toContain('Provedor');
    expect(topBar?.textContent).toContain('Meus Anúncios');
    // Sidebar header brand is present alongside the section context.
    expect(container.textContent).toContain('Showcase do Bairro');
  });

  test('moderation chrome shows selected condo context in sidebar header and top bar', () => {
    mockSession = session('USER');
    mockAssignments = [
      {
        id: 'a1',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
      {
        id: 'a2',
        condominiumId: 'condo-2',
        condominium: { id: 'condo-2', name: 'Condo Beta' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ];
    localStorage.setItem('mod_ctx__cndo', 'condo-2');
    globalThis.location.href = 'http://localhost/panel/moderation/condominium';

    const { container } = renderPanel();
    const topBar = container.querySelector('header');
    expect(topBar).not.toBeNull();
    expect(topBar?.textContent).toContain('Moderação');
    expect(topBar?.textContent).toContain('Informações do Condomínio');
    expect(topBar?.textContent).toContain('Condo Beta');
    expect(container.textContent).toContain('Showcase do Bairro');
    expect(container.textContent).toContain('Condo Beta');
  });
});
