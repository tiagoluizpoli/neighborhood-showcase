import { describe, expect, test } from 'bun:test';
import { AdminProvidersPanel } from './-admin-providers-panel';

const mockProviders = [
  {
    id: '1',
    name: 'Alice Provider',
    email: 'alice@example.com',
    status: 'ACTIVE' as const,
  },
  {
    id: '2',
    name: 'Bob Banned',
    email: 'bob@example.com',
    status: 'BANNED' as const,
  },
  {
    id: '3',
    name: 'Carol Active',
    email: 'carol@example.com',
    status: 'ACTIVE' as const,
  },
];

const textContent = (node: unknown): string => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (typeof node !== 'object' || node === null) return '';
  const children = (node as { props?: { children?: unknown } }).props?.children;
  if (!children) return '';
  if (Array.isArray(children)) {
    return children.map((child) => textContent(child)).join('');
  }
  return textContent(children);
};

const findElement = (
  node: unknown,
  predicate: (element: {
    props?: { [key: string]: unknown };
    type?: unknown;
  }) => boolean,
): { props?: { [key: string]: unknown }; type?: unknown } | null => {
  if (!node) return null;
  const element = node as {
    props?: { [key: string]: unknown };
    type?: unknown;
  };
  if (predicate(element)) return element;

  if (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    typeof element.type === 'function'
  ) {
    const evaluated = (
      node as { props?: unknown; type: (props?: unknown) => unknown }
    ).type((node as { props?: unknown }).props);
    const found = findElement(evaluated, predicate);
    if (found) return found;
  }

  const children = element.props?.children;
  if (!children) return null;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
};

const hasText =
  (text: string) =>
  (element: { props?: { [key: string]: unknown }; type?: unknown }) =>
    textContent(element).includes(text);

const hasPlaceholder =
  (placeholder: string) =>
  (element: { props?: { [key: string]: unknown }; type?: unknown }) =>
    element.props?.placeholder === placeholder;

describe('AdminProvidersPanel', () => {
  test('renders header title', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: mockProviders,
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Diretório de Provedores'))).toBeTruthy();
  });

  test('renders search input', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: mockProviders,
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(
      findElement(tree, hasPlaceholder('Buscar por nome ou e-mail...')),
    ).toBeTruthy();
  });

  test('renders provider rows with names and emails', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: mockProviders,
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Alice Provider'))).toBeTruthy();
    expect(findElement(tree, hasText('alice@example.com'))).toBeTruthy();
    expect(findElement(tree, hasText('Carol Active'))).toBeTruthy();
    expect(findElement(tree, hasText('carol@example.com'))).toBeTruthy();
  });

  test('renders active and banned status badges', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: mockProviders,
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Ativo'))).toBeTruthy();
    expect(findElement(tree, hasText('Banido'))).toBeTruthy();
  });

  test('shows loading state when isPending is true', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: true,
      providers: [],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(
      findElement(
        tree,
        (element) =>
          (element.props?.className as string | undefined)?.includes(
            'animate-spin',
          ) ?? false,
      ),
    ).toBeTruthy();
  });

  test('shows empty state when no providers', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: [],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(
      findElement(tree, hasText('Nenhum provedor encontrado.')),
    ).toBeTruthy();
  });

  test('shows ban form with reason label and action buttons when banningUserId is set', () => {
    const tree = AdminProvidersPanel({
      banningUserId: '1',
      banPending: false,
      banReason: '',
      isPending: false,
      providers: [mockProviders[0]],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Motivo do Banimento'))).toBeTruthy();
    expect(findElement(tree, hasText('Cancelar'))).toBeTruthy();
    expect(findElement(tree, hasText('Confirmar Ban'))).toBeTruthy();
  });

  test('shows Banir Provedor button for active providers when not banning', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: [mockProviders[0]],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Banir Provedor'))).toBeTruthy();
  });

  test('shows Ações desabilitadas for banned providers', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: [mockProviders[1]],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Ações desabilitadas'))).toBeTruthy();
  });

  test('ban form shows Confirm Ban button and Cancel button when in ban state', () => {
    const tree = AdminProvidersPanel({
      banningUserId: '1',
      banPending: true,
      banReason: 'Fraude',
      isPending: false,
      providers: [mockProviders[0]],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    // Both action buttons are present in the ban form
    expect(findElement(tree, hasText('Confirmar Ban'))).toBeTruthy();
    expect(findElement(tree, hasText('Cancelar'))).toBeTruthy();
  });

  test('ban form shows Confirm Ban button and Cancel button even when reason is empty', () => {
    const tree = AdminProvidersPanel({
      banningUserId: '1',
      banPending: false,
      banReason: '',
      isPending: false,
      providers: [mockProviders[0]],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Confirmar Ban'))).toBeTruthy();
    expect(findElement(tree, hasText('Cancelar'))).toBeTruthy();
  });

  test('ban form shows Confirm Ban button and Cancel button when reason is filled', () => {
    const tree = AdminProvidersPanel({
      banningUserId: '1',
      banPending: false,
      banReason: 'Spam recorrente',
      isPending: false,
      providers: [mockProviders[0]],
      search: '',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    expect(findElement(tree, hasText('Confirmar Ban'))).toBeTruthy();
    expect(findElement(tree, hasText('Cancelar'))).toBeTruthy();
  });

  test('search input value reflects search prop', () => {
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: mockProviders,
      search: 'Alice',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    const searchInput = findElement(
      tree,
      hasPlaceholder('Buscar por nome ou e-mail...'),
    );
    expect(searchInput).toBeTruthy();
    expect(searchInput?.props?.value).toBe('Alice');
  });

  test('onSearchChange is called when search prop changes', () => {
    let searchValue = '';
    const tree = AdminProvidersPanel({
      banningUserId: null,
      banPending: false,
      banReason: '',
      isPending: false,
      providers: mockProviders,
      search: 'test',
      onBanReasonChange: () => {},
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: (val) => {
        searchValue = val;
      },
    });

    const searchInput = findElement(
      tree,
      hasPlaceholder('Buscar por nome ou e-mail...'),
    );
    expect(searchInput).toBeTruthy();
    // Simulate onChange by calling the handler directly
    (
      searchInput?.props?.onChange as unknown as (
        e: React.ChangeEvent<HTMLInputElement>,
      ) => void
    )({
      target: { value: 'NewSearch' },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    expect(searchValue).toBe('NewSearch');
  });

  test('onBanReasonChange is called when typing in ban reason input', () => {
    let reasonValue = '';
    const tree = AdminProvidersPanel({
      banningUserId: '1',
      banPending: false,
      banReason: '',
      isPending: false,
      providers: [mockProviders[0]],
      search: '',
      onBanReasonChange: (val) => {
        reasonValue = val;
      },
      onOpenBan: () => {},
      onCloseBan: () => {},
      onConfirmBan: () => {},
      onSearchChange: () => {},
    });

    const reasonInput = findElement(
      tree,
      (element) =>
        element.props?.placeholder === 'Ex: Fraude ou spam recorrente',
    );
    expect(reasonInput).toBeTruthy();
    (
      reasonInput?.props?.onChange as unknown as (
        e: React.ChangeEvent<HTMLInputElement>,
      ) => void
    )({
      target: { value: 'Fraude digitada' },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    expect(reasonValue).toBe('Fraude digitada');
  });
});
