import { describe, expect, test } from 'bun:test';
import { AdminPendingCondosQueue } from './-admin-pending-condos-queue';

const pendingCondo = {
  cep: '01000-000',
  city: 'Sao Paulo',
  id: 'condo-1',
  name: 'Residencial Exemplo',
  proofUrl: 'https://example.com/proof.pdf',
  state: 'SP',
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

describe('AdminPendingCondosQueue', () => {
  test('renders empty state when there are no pending condos', () => {
    const tree = AdminPendingCondosQueue({
      approvePending: false,
      isPending: false,
      isRejectingId: null,
      pendingCondos: [],
      reason: '',
      rejectPending: false,
      onApprove: () => {},
      onOpenPreview: () => {},
      onOpenReject: () => {},
      onReasonChange: () => {},
      onReject: () => {},
      onRejectCancel: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Tudo limpo!'),
      ),
    ).toBeTruthy();
  });

  test('renders pending condo details and reject state', () => {
    const tree = AdminPendingCondosQueue({
      approvePending: false,
      isPending: false,
      isRejectingId: 'condo-1',
      pendingCondos: [pendingCondo],
      reason: 'Documento ilegivel',
      rejectPending: false,
      onApprove: () => {},
      onOpenPreview: () => {},
      onOpenReject: () => {},
      onReasonChange: () => {},
      onReject: () => {},
      onRejectCancel: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Residencial Exemplo'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Motivo da Rejeição *'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Confirmar Rejeição'),
      ),
    ).toBeTruthy();
  });
});
