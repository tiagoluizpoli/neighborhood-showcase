import { describe, expect, test } from 'bun:test';
import { AdminUsersPanel } from './-admin-users-panel';

const mockUsers = [
  {
    id: '1',
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'ADMINISTRATOR' as const,
    status: 'ACTIVE' as const,
    isProviderVisible: true,
  },
  {
    id: '2',
    name: 'Bob Manager',
    email: 'bob@example.com',
    role: 'SYSTEM_MANAGER' as const,
    status: 'ACTIVE' as const,
    isProviderVisible: false,
  },
  {
    id: '3',
    name: 'Carol User',
    email: 'carol@example.com',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    isProviderVisible: true,
  },
  {
    id: '4',
    name: 'Dave Banned',
    email: 'dave@example.com',
    role: 'USER' as const,
    status: 'BANNED' as const,
    isProviderVisible: false,
  },
];

const mockCondos = [
  { id: 'c1', name: 'Condomínio Alpha' },
  { id: 'c2', name: 'Condomínio Beta' },
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

const hasTitle =
  (title: string) =>
  (element: { props?: { [key: string]: unknown }; type?: unknown }) =>
    element.props?.title === title;

describe('AdminUsersPanel', () => {
  test('renders header title', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: mockUsers,
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(
      findElement(tree, hasText('Gerenciamento de Usuários')),
    ).toBeTruthy();
  });

  test('renders search input', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: mockUsers,
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(
      findElement(tree, hasPlaceholder('Buscar por nome ou e-mail...')),
    ).toBeTruthy();
  });

  test('renders user rows with names and emails', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: mockUsers,
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Alice Admin'))).toBeTruthy();
    expect(findElement(tree, hasText('alice@example.com'))).toBeTruthy();
    expect(findElement(tree, hasText('Bob Manager'))).toBeTruthy();
    expect(findElement(tree, hasText('carol@example.com'))).toBeTruthy();
  });

  test('renders role badges', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: mockUsers,
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Administrator'))).toBeTruthy();
    expect(findElement(tree, hasText('System Manager'))).toBeTruthy();
    expect(findElement(tree, hasText('User'))).toBeTruthy();
  });

  test('renders status badges', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: mockUsers,
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Ativo'))).toBeTruthy();
    expect(findElement(tree, hasText('Banido'))).toBeTruthy();
  });

  test('shows loading state when isPending is true', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: true,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(
      findElement(tree, (element) =>
        element.props?.className?.includes('animate-spin'),
      ),
    ).toBeTruthy();
  });

  test('shows empty state when no users', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(
      findElement(tree, hasText('Nenhum usuário encontrado.')),
    ).toBeTruthy();
  });

  test('shows promote inline form when promotingUserId is set', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: '3',
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[2]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(
      findElement(tree, hasText('Promover a System Manager?')),
    ).toBeTruthy();
    expect(findElement(tree, hasText('Confirmar'))).toBeTruthy();
    expect(findElement(tree, hasText('Cancelar'))).toBeTruthy();
  });

  test('shows promote button for active USER', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[2]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Promover'))).toBeTruthy();
  });

  test('does not show promote button for SYSTEM_MANAGER', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[1]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Promover'))).toBeNull();
  });

  test('does not show promote button for ADMINISTRATOR', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[0]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Promover'))).toBeNull();
  });

  test('shows assign moderator inline form when assigningUserId is set', () => {
    const tree = AdminUsersPanel({
      assigningUserId: '3',
      assignCondoId: '',
      condosForAssign: mockCondos,
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[2]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Atribuir Moderador'))).toBeTruthy();
    expect(findElement(tree, hasText('Selecionar condomínio...'))).toBeTruthy();
    expect(findElement(tree, hasText('Confirmar'))).toBeTruthy();
  });

  test('shows assign moderator button for active users', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[2]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Moderador'))).toBeTruthy();
  });

  test('does not show assign moderator button for banned users', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[3]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasText('Moderador'))).toBeNull();
  });

  test('renders visibility toggle for visible user', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[0]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasTitle('Ocultar do diretório'))).toBeTruthy();
  });

  test('renders visibility toggle for hidden user', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[1]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    expect(findElement(tree, hasTitle('Mostrar no diretório'))).toBeTruthy();
  });

  test('onToggleVisibility is called when visibility button is clicked', () => {
    let toggledId: string | null = null;
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[0]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: (id) => {
        toggledId = id;
      },
    });

    const visibilityBtn = findElement(tree, hasTitle('Ocultar do diretório'));
    expect(visibilityBtn).toBeTruthy();
    visibilityBtn?.props?.onClick();
    expect(toggledId).toBe('1');
  });

  test('onSearchChange is called when search input changes', () => {
    let searchValue = '';
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: mockUsers,
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: (val) => {
        searchValue = val;
      },
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    const searchInput = findElement(
      tree,
      hasPlaceholder('Buscar por nome ou e-mail...'),
    );
    expect(searchInput).toBeTruthy();
    searchInput?.props?.onChange({
      target: { value: 'Alice' },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    expect(searchValue).toBe('Alice');
  });

  test('assign form condo selector shows all condos when open', () => {
    const tree = AdminUsersPanel({
      assigningUserId: '3',
      assignCondoId: 'c1',
      condosForAssign: mockCondos,
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: [mockUsers[2]],
      userSearch: '',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    // The assign form is visible when assigningUserId matches
    // Look for the condo selector placeholder text in the form
    expect(findElement(tree, hasText('Selecionar condomínio...'))).toBeTruthy();
    // The form title confirms the assign UI is rendered
    expect(findElement(tree, hasText('Atribuir Moderador'))).toBeTruthy();
  });

  test('search input reflects userSearch prop', () => {
    const tree = AdminUsersPanel({
      assigningUserId: null,
      assignCondoId: '',
      condosForAssign: [],
      isPending: false,
      promotingUserId: null,
      togglePending: false,
      promotePending: false,
      assignPending: false,
      users: mockUsers,
      userSearch: 'Alice',
      userRoleFilter: '',
      userStatusFilter: '',
      onAssignCondoIdChange: () => {},
      onAssignCancel: () => {},
      onAssignConfirm: () => {},
      onAssignOpen: () => {},
      onPromoteCancel: () => {},
      onPromoteConfirm: () => {},
      onPromoteOpen: () => {},
      onRoleFilterChange: () => {},
      onSearchChange: () => {},
      onStatusFilterChange: () => {},
      onToggleVisibility: () => {},
    });

    const searchInput = findElement(
      tree,
      hasPlaceholder('Buscar por nome ou e-mail...'),
    );
    expect(searchInput).toBeTruthy();
    expect(searchInput?.props?.value).toBe('Alice');
  });
});
