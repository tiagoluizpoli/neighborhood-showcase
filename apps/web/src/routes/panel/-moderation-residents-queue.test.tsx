import { describe, expect, test } from 'bun:test';
import { ModerationResidentsQueue } from './-moderation-residents-queue';

const pendingResident = {
  id: 'resident-1',
  proofOfResidency: 'https://example.com/proof.pdf',
  provider: {
    name: 'Morador Exemplo',
  },
  unitInfo: 'Bloco A 101',
};

const t = (key: string) => key;

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

describe('ModerationResidentsQueue', () => {
  test('renders the resident summary and proof preview affordance', () => {
    const tree = ModerationResidentsQueue({
      approvePending: false,
      isRejectingId: null,
      pendingResidents: [pendingResident],
      reason: '',
      rejectPending: false,
      t,
      onApprove: () => {},
      onCancelReject: () => {},
      onOpenProof: () => {},
      onReasonChange: () => {},
      onReject: () => {},
      onStartReject: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Morador Exemplo'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Bloco A 101'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Visualizar'),
      ),
    ).toBeTruthy();
  });

  test('renders the reject form when the resident is being reviewed', () => {
    const tree = ModerationResidentsQueue({
      approvePending: false,
      isRejectingId: pendingResident.id,
      pendingResidents: [pendingResident],
      reason: 'Documento ilegível',
      rejectPending: false,
      t,
      onApprove: () => {},
      onCancelReject: () => {},
      onOpenProof: () => {},
      onReasonChange: () => {},
      onReject: () => {},
      onStartReject: () => {},
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Motivo da Rejeição *'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('moderation.confirm'),
      ),
    ).toBeTruthy();
  });
});
