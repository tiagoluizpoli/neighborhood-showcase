import { describe, expect, test } from 'bun:test';
import { AdminBlacklistPanel } from './-admin-blacklist-panel';

const blacklistRecord = {
  cpfHash: '85afb35c0245a49',
  id: 'blacklist-1',
  reason: 'Fraude recorrente',
};

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

describe('AdminBlacklistPanel', () => {
  test('renders empty state when no blacklist records exist', () => {
    const tree = AdminBlacklistPanel({
      addPending: false,
      blacklist: [],
      blacklistReason: '',
      isPending: false,
      newCpfHash: '',
      removePending: false,
      onBlacklistReasonChange: () => {},
      onNewCpfHashChange: () => {},
      onRemove: () => {},
      onSubmit: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Nenhum CPF na lista negra.'),
      ),
    ).toBeTruthy();
  });

  test('renders blacklist records and add form copy', () => {
    const tree = AdminBlacklistPanel({
      addPending: false,
      blacklist: [blacklistRecord],
      blacklistReason: 'Fraude recorrente',
      isPending: false,
      newCpfHash: '85afb35c0245a49',
      removePending: false,
      onBlacklistReasonChange: () => {},
      onNewCpfHashChange: () => {},
      onRemove: () => {},
      onSubmit: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Adicionar CPF Blacklist'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('85afb35c0245a49'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Fraude recorrente'),
      ),
    ).toBeTruthy();
  });
});
