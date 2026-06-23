import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockDashboardData: any = null;
// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockAssignments: any = [];
// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockPublicAnnouncementData: any = null;
const mockProviderProfileData = {
  contactDefaults: { primaryPhone: '+5511999999999', callEnabled: true },
};

// Captures every mutation fired through the trpc proxy so parity tests can
// assert which procedure (create vs update) the shared form submits to and with
// what variables — the route-boundary seam for "create submits via create,
// edit submits via update carrying id".
// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
const mutationCalls: Array<{ method: string; variables: any }> = [];

// Test-only crop area handed to the react-easy-crop stub below so an uploaded
// image yields a non-null croppedAreaPixels (the create-flow image guard).
const stubCropArea = { x: 0, y: 0, width: 400, height: 300 };

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
function trpcData(method: string): any {
  switch (method) {
    case 'getDashboardData':
      return mockDashboardData;
    case 'getPublic':
      return mockPublicAnnouncementData;
    case 'listCategories':
      return [
        {
          id: 'cat-1',
          name: 'Test Category',
          slug: 'test-category',
          displayOrder: 1,
          isActive: true,
        },
      ];
    case 'listTagSuggestions':
      return [];
    case 'getMyAssignments':
      return mockAssignments;
    case 'get':
      return mockProviderProfileData;
    default:
      return null;
  }
}

const makeMethod = (method: string) => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  queryOptions: (input?: any, opts?: any) => ({
    queryKey: [method, input ?? null],
    queryFn: async () => trpcData(method),
    initialData: trpcData(method),
    ...(opts || {}),
  }),
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  queryKey: (input?: any) => [method, input ?? null],
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  mutationOptions: (opts?: any) => ({
    // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
    mutationFn: async (variables: any) => {
      mutationCalls.push({ method, variables });
      return {};
    },
    ...(opts || {}),
  }),
});

const trpcProxy = new Proxy(
  {},
  {
    get: () =>
      new Proxy({}, { get: (_t, method: string) => makeMethod(method) }),
  },
);
const trpcClientProxy = new Proxy(
  {},
  {
    get: () =>
      new Proxy(
        {},
        {
          get: (_t, method: string) => ({
            query: async () => trpcData(method),
            mutate: async () => ({}),
          }),
        },
      ),
  },
);
mock.module('@/utils/trpc', () => ({
  trpc: trpcProxy,
  trpcClient: trpcClientProxy,
}));

mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'u', name: 'U', role: 'USER' } },
      isPending: false,
    }),
  },
}));

mock.module('sonner', () => ({
  toast: { error: () => {}, success: () => {} },
}));
// react-easy-crop stub fires onCropComplete on mount so an uploaded image
// produces a non-null croppedAreaPixels without a real (unmeasurable) cropper.
mock.module('react-easy-crop', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  default: ({ onCropComplete }: any) => {
    useEffect(() => {
      onCropComplete?.({ x: 0, y: 0, width: 400, height: 300 }, stubCropArea);
    }, [onCropComplete]);
    return null;
  },
}));
// The real category combobox is a Base UI popover + cmdk list that never mounts
// its options in happy-dom (no layout/positioning). Stub it to a controlled
// button so categoryId is settable at the route seam. No other test imports
// this component, so the process-global mock does not leak into another suite.
mock.module('@/components/announcement-category-combobox', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  AnnouncementCategoryCombobox: ({ value, onChange }: any) => (
    <button
      type="button"
      data-testid="category-stub"
      data-category-value={value}
      onClick={() => onChange('cat-1')}
    >
      category
    </button>
  ),
}));
mock.module('@neighborhood-showcase/ui/components/chart', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  ChartContainer: ({ children }: any) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));
// recharts is stubbed globally in test-setup.ts.

const mockAnnouncement = {
  id: 'ann-1',
  category: 'Test Category',
  categoryId: 'cat-1',
  condoName: 'Test Condo',
  contact: { mode: 'inherit', custom: null },
  contactLinks: { phone: '+5511999999999', whatsapp: '+5511999999999' },
  createdAt: '2024-01-01T00:00:00.000Z',
  cta: { primary: null, secondary: [] },
  description: 'Test description',
  expiresAt: null,
  flaggedForReview: false,
  imageUrl: 'http://example.com/img.jpg',
  paidAt: null,
  priceCents: null,
  providerAssignmentId: 'assign-1',
  showVerifiedBadge: false,
  status: 'ACTIVE',
  subtitle: null,
  suspensionReason: null,
  tags: [],
  title: 'Test Announcement',
};

const withAnnouncement = (
  // biome-ignore lint/suspicious/noExplicitAny: fixture override
  overrides: any = mockAnnouncement,
) => ({
  announcements: { active: [overrides], draft: [], expired: [], suspended: [] },
  stats: { totalImpressions: 0, totalInteractions: 0, conversionRate: 0 },
});

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// biome-ignore lint/suspicious/noExplicitAny: route component type
function renderRoute(Component: any) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

async function importEditRoute() {
  const { Route } = await import(
    '@/routes/panel.provider.announcements.$id.edit'
  );
  Route.useParams = (() => ({ id: 'ann-1' })) as typeof Route.useParams;
  return Route;
}

async function importDetailRoute() {
  const { Route } = await import(
    '@/routes/panel.provider.announcements.$id.index'
  );
  Route.useParams = (() => ({ id: 'ann-1' })) as typeof Route.useParams;
  return Route;
}

async function importPortalRoute() {
  const { Route } = await import('@/routes/_portal.anuncios.$id');
  Route.useParams = (() => ({ id: 'pub-1' })) as typeof Route.useParams;
  return Route;
}

describe('Provider announcements routes', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    mockDashboardData = null;
    mockAssignments = [];
    mockPublicAnnouncementData = null;
    mutationCalls.length = 0;
  });

  test('announcements index error state: outer wrapper has no px-6 or py-8', async () => {
    const { Route } = await import(
      '@/routes/panel.provider.announcements.index'
    );
    const { container } = renderRoute(Route.options.component);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).not.toContain('px-6');
    expect(outer.className).not.toContain('py-8');
  });

  test('announcements new: renders inside the default PanelContentContainer', async () => {
    const { Route } = await import('@/routes/panel.provider.announcements.new');
    const { container } = renderRoute(Route.options.component);
    const outer = container.firstElementChild as HTMLElement;
    // Outer element is the shared container (not a bespoke padded div).
    expect(outer.getAttribute('data-container-variant')).toBe('default');
  });

  test('announcements new: page title and subtitle resolve through i18n', async () => {
    const { Route } = await import('@/routes/panel.provider.announcements.new');
    const { container } = renderRoute(Route.options.component);
    expect(container.textContent).toContain('Novo Anúncio');
    expect(container.textContent).toContain(
      'Crie um rascunho da sua oferta e publique para seus vizinhos.',
    );
  });

  test('announcements $id: detail-header renders the announcement title', async () => {
    mockDashboardData = withAnnouncement();
    const { Route } = await import(
      '@/routes/panel.provider.announcements.$id.index'
    );
    Route.useParams = (() => ({ id: 'ann-1' })) as typeof Route.useParams;
    const { container } = renderRoute(Route.options.component);

    expect(
      (await screen.findAllByText('Test Announcement')).length,
    ).toBeGreaterThan(0);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.getAttribute('data-container-variant')).toBe('default');
  });

  // --- T-18-05 / ST-01: shared-form parity + field-policy lock --------------

  test('edit mode renders the shared form in edit mode for the routed id', async () => {
    mockDashboardData = withAnnouncement();
    const Route = await importEditRoute();
    const { container } = renderRoute(Route.options.component);

    const form = await waitFor(() =>
      container.querySelector('[data-testid="announcement-form-edit"]'),
    );
    expect(form).toBeTruthy();
    expect(form?.getAttribute('data-announcement-id')).toBe('ann-1');
  });

  test('edit mode prefills every authored field from the fetched announcement', async () => {
    mockDashboardData = withAnnouncement({
      ...mockAnnouncement,
      subtitle: 'A subtitle',
      description: 'A long enough description',
      title: 'Prefilled Title',
    });
    const Route = await importEditRoute();
    const { container } = renderRoute(Route.options.component);

    await waitFor(() => {
      const title = container.querySelector<HTMLInputElement>('#title');
      expect(title?.value).toBe('Prefilled Title');
    });
    expect(container.querySelector<HTMLInputElement>('#subtitle')?.value).toBe(
      'A subtitle',
    );
    expect(
      container.querySelector<HTMLTextAreaElement>('#description')?.value,
    ).toBe('A long enough description');
    // Inherited contact authoring is wired through the shared section.
    expect(
      container.querySelector('[data-testid="contact-mode-inherit-badge"]'),
    ).toBeTruthy();
  });

  test('edit mode prefills a custom contact phone into the authoring section', async () => {
    mockDashboardData = withAnnouncement({
      ...mockAnnouncement,
      contact: {
        mode: 'custom',
        custom: { primaryPhone: '+5511888888888', callEnabled: false },
      },
      contactLinks: { whatsapp: '+5511888888888' },
    });
    const Route = await importEditRoute();
    const { container } = renderRoute(Route.options.component);

    await waitFor(() => {
      const phone = container.querySelector<HTMLInputElement>(
        '#custom-contact-phone',
      );
      expect(phone?.value).toBe('+5511888888888');
    });
  });

  test('edit mode submits via announcement.update carrying the routed id', async () => {
    mockDashboardData = withAnnouncement();
    const Route = await importEditRoute();
    const { container } = renderRoute(Route.options.component);

    const form = (await waitFor(() =>
      container.querySelector('[data-testid="announcement-form-edit"]'),
    )) as HTMLFormElement;
    // Prefill provides category, location, and existing image — all guards pass.
    fireEvent.submit(form);

    await waitFor(() => expect(mutationCalls.length).toBeGreaterThan(0));
    const update = mutationCalls.find((c) => c.method === 'update');
    expect(update).toBeTruthy();
    expect(update?.variables.id).toBe('ann-1');
    // Update is location-fixed: it never carries a providerAssignmentId.
    expect(update?.variables.providerAssignmentId).toBeUndefined();
    expect(mutationCalls.some((c) => c.method === 'create')).toBe(false);
  });

  test('create mode submits via announcement.create with no id', async () => {
    mockAssignments = [
      {
        id: 'assign-1',
        status: 'APPROVED',
        type: 'EXTERNAL',
        number: '10',
        unitInfo: null,
        condominium: null,
      },
    ];
    const { AnnouncementForm } = await import(
      '@/routes/panel/provider/-announcement-form'
    );
    const { container } = renderRoute(() => <AnnouncementForm mode="create" />);

    // Patch the canvas + Image globals the real getCroppedImg relies on (the
    // same technique crop-image.test.ts uses) plus fetch, so the create flow's
    // upload path resolves. Restore everything afterwards — no module mock, so
    // nothing leaks into other suites.
    const originalCreateElement = document.createElement.bind(document);
    const originalImage = globalThis.Image;
    const originalFetch = globalThis.fetch;
    // biome-ignore lint/suspicious/noExplicitAny: minimal canvas stub
    const canvasStub: any = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: () => {} }),
      // biome-ignore lint/suspicious/noExplicitAny: blob callback
      toBlob: (cb: any) => cb(new Blob(['img'], { type: 'image/webp' })),
    };
    document.createElement = ((tag: string) =>
      tag === 'canvas'
        ? canvasStub
        : originalCreateElement(tag)) as typeof document.createElement;
    globalThis.Image = class {
      onload: (() => void) | null = null;
      // biome-ignore lint/suspicious/noExplicitAny: error handler
      onerror: ((err: any) => void) | null = null;
      src = '';
      crossOrigin = '';
      constructor() {
        queueMicrotask(() => this.onload?.());
      }
      // biome-ignore lint/suspicious/noExplicitAny: addEventListener stub
      addEventListener(event: string, cb: any) {
        if (event === 'load') this.onload = cb;
        if (event === 'error') this.onerror = cb;
      }
      // biome-ignore lint/suspicious/noExplicitAny: Image global cast
    } as any;
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => ({ url: 'http://example.com/uploaded.webp' }),
      // biome-ignore lint/suspicious/noExplicitAny: fetch global cast
    })) as any;

    try {
      // Single approved location auto-selects; pick a category via the stub.
      fireEvent.click(screen.getByTestId('category-stub'));
      const titleInput = container.querySelector<HTMLInputElement>('#title');
      const descriptionInput =
        container.querySelector<HTMLTextAreaElement>('#description');
      const fileInput =
        container.querySelector<HTMLInputElement>('input[type="file"]');
      if (!(titleInput && descriptionInput && fileInput)) {
        throw new Error('create-form inputs missing');
      }
      fireEvent.change(titleInput, { target: { value: 'A valid title' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'A long enough description here' },
      });

      const file = new File(['imgbytes'], 'cover.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const form = container.querySelector(
        '[data-testid="announcement-form-create"]',
      ) as HTMLFormElement;
      // Wait for the file reader + cropper stub to populate the crop area.
      await waitFor(() => {
        fireEvent.submit(form);
        expect(mutationCalls.length).toBeGreaterThan(0);
      });

      const create = mutationCalls.find((c) => c.method === 'create');
      expect(create).toBeTruthy();
      expect(create?.variables.providerAssignmentId).toBe('assign-1');
      expect(create?.variables.id).toBeUndefined();
      expect(mutationCalls.some((c) => c.method === 'update')).toBe(false);
    } finally {
      document.createElement = originalCreateElement;
      globalThis.Image = originalImage;
      globalThis.fetch = originalFetch;
    }
  });

  test('create and edit expose the same authoring input surface', async () => {
    // Create surface.
    const { AnnouncementForm } = await import(
      '@/routes/panel/provider/-announcement-form'
    );
    const created = renderRoute(() => <AnnouncementForm mode="create" />);
    const createSelectors = [
      '#title',
      '#subtitle',
      '#description',
      '[data-testid="category-stub"]',
      'input[type="file"]',
    ];
    for (const sel of createSelectors) {
      expect(created.container.querySelector(sel)).toBeTruthy();
    }
    created.unmount();

    // Edit surface — same inputs must be present.
    mockDashboardData = withAnnouncement();
    const Route = await importEditRoute();
    const edited = renderRoute(Route.options.component);
    await waitFor(() =>
      expect(
        edited.container.querySelector(
          '[data-testid="announcement-form-edit"]',
        ),
      ).toBeTruthy(),
    );
    for (const sel of createSelectors) {
      expect(edited.container.querySelector(sel)).toBeTruthy();
    }
  });

  // --- T-18-05 / ST-02: view-page facts-first + analytics assertions ----------

  test('$id: announcement title renders in h1 before the analytics section', async () => {
    mockDashboardData = withAnnouncement();
    const Route = await importDetailRoute();
    const { container } = renderRoute(Route.options.component);

    const h1 = await waitFor(() => {
      const el = container.querySelector('h1');
      if (!el) throw new Error('h1 not found');
      return el;
    });
    expect(h1.textContent).toContain('Test Announcement');

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    // 4 = DOCUMENT_POSITION_FOLLOWING: section comes after h1 in document order
    const position = section ? h1.compareDocumentPosition(section) & 4 : 0;
    expect(position).toBe(4);
  });

  test('$id: cover image is a constrained 4:3 block, not a full-width hero', async () => {
    mockDashboardData = withAnnouncement();
    const Route = await importDetailRoute();
    const { container } = renderRoute(Route.options.component);

    await waitFor(() => expect(container.querySelector('h1')).toBeTruthy());

    const img = container.querySelector('img');
    expect(img?.className).toContain('object-cover');
    // Constrained wrapper carries aspect-[4/3] + lg:w-[300px], not a full-width hero
    expect(container.innerHTML).toContain('aspect-[4/3]');
    expect(container.innerHTML).toContain('lg:w-[300px]');
  });

  test('$id: summary mini-card is absent (no dashed-border block in output)', async () => {
    mockDashboardData = withAnnouncement();
    const Route = await importDetailRoute();
    const { container } = renderRoute(Route.options.component);

    await waitFor(() => expect(container.querySelector('h1')).toBeTruthy());

    // The removed mini-card used border-dashed on a Card element.
    // Analytics loading/error states also use border-dashed, but those do not
    // render when getAnalytics has initialData (chart path renders instead).
    expect(container.querySelector('[class*="border-dashed"]')).toBeNull();
  });

  test('$id analytics: three metric cards are always visible', async () => {
    mockDashboardData = withAnnouncement();
    const Route = await importDetailRoute();
    const { container } = renderRoute(Route.options.component);

    await waitFor(() => expect(container.querySelector('h1')).toBeTruthy());

    const text = container.textContent ?? '';
    expect(text).toContain('Visualizações');
    expect(text).toContain('Interações');
    expect(text).toContain('Conversão');
  });

  test('$id analytics: chart container uses 210px height band, not the old 320px', async () => {
    mockDashboardData = withAnnouncement();
    const Route = await importDetailRoute();
    const { container } = renderRoute(Route.options.component);

    await waitFor(() => expect(container.querySelector('h1')).toBeTruthy());

    expect(container.innerHTML).toContain('h-[210px]');
    expect(container.innerHTML).not.toContain('h-[320px]');
  });

  // --- T-18-05 / ST-03: create regression guard + public-boundary guard -------

  test('create form retains image cropper, contact section, and CTA section after shared-form extraction', async () => {
    const { AnnouncementForm } = await import(
      '@/routes/panel/provider/-announcement-form'
    );
    const { container } = renderRoute(() => <AnnouncementForm mode="create" />);

    // Image upload input (triggers file picker → cropper)
    expect(container.querySelector('input[type="file"]')).toBeTruthy();
    // Contact section is present: inherit badge is the default state
    expect(
      container.querySelector('[data-testid="contact-mode-inherit-badge"]'),
    ).toBeTruthy();
    // CTA section is present
    expect(container.querySelector('[data-testid="cta-section"]')).toBeTruthy();
  });

  test('public route _portal.anuncios.$id exposes no analytics or edit affordance', async () => {
    // Populate a full public announcement so the component reaches the render
    // branch — the boundary holds in loading/empty states too, but testing the
    // rich state is more meaningful.
    mockPublicAnnouncementData = {
      id: 'pub-1',
      providerId: 'prov-1',
      condominiumId: null,
      condoName: 'Condo A',
      condoCity: 'City',
      condoState: 'SC',
      title: 'Public Title',
      subtitle: null,
      description: 'Public description.',
      priceCents: null,
      imageUrl: 'http://example.com/pub.jpg',
      category: 'Services',
      tags: [],
      contactLinks: { phone: '', whatsapp: '', email: null },
      cta: { primary: null, secondary: [] },
      showVerifiedBadge: false,
      providerName: 'Provider A',
      providerAvatarUrl: null,
    };
    const Route = await importPortalRoute();
    const { container } = renderRoute(Route.options.component);

    const text = container.textContent ?? '';
    // No analytics metric cards — those labels live only in the provider panel
    expect(text).not.toContain('Visualizações');
    expect(text).not.toContain('Interações');
    expect(text).not.toContain('Conversão');
    // No analytics chart height classes
    expect(container.innerHTML).not.toContain('h-[210px]');
    expect(container.innerHTML).not.toContain('h-[320px]');
    // No edit affordance — no link or button pointing to the edit route
    expect(container.innerHTML).not.toContain('/edit');
    expect(text).not.toContain('Editar');
  });

  // --- T-18-05 / ST-01: shared-form parity + field-policy lock --------------

  test('field-policy seam locks identity and a representative frozen field', async () => {
    const { AnnouncementForm, resolveAnnouncementFieldPolicy } = await import(
      '@/routes/panel/provider/-announcement-form'
    );

    // Identity is non-editable in edit and vacuously editable in create; the
    // id is never rendered as an input.
    expect(resolveAnnouncementFieldPolicy('edit').id.editable).toBe(false);
    expect(resolveAnnouncementFieldPolicy('create').id.editable).toBe(true);

    // Freeze a representative field (title) through the policy override — no
    // structural change, just one flipped entry — and assert it renders
    // disabled.
    const frozen = {
      ...resolveAnnouncementFieldPolicy('create'),
      title: { editable: false },
    };
    const { container } = renderRoute(() => (
      <AnnouncementForm mode="create" fieldPolicy={frozen} />
    ));
    expect(container.querySelector('#id')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('#title')?.disabled).toBe(
      true,
    );
    // A non-frozen field remains editable under the same policy.
    expect(
      container.querySelector<HTMLInputElement>('#subtitle')?.disabled,
    ).toBe(false);
  });
});
