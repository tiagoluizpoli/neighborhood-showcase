// biome-ignore-all lint/suspicious/noExplicitAny: Lightweight component unit harness uses simple mocks.
import { describe, expect, test } from 'bun:test';
import { ProviderDashboardCondoSetupStatusPanels } from './-provider-dashboard-condo-setup-status-panels';

const findElement = (node: any, predicate: (el: any) => boolean): any => {
  if (!node) return null;
  if (predicate(node)) return node;
  if (node && typeof node.type === 'function') {
    try {
      const evaluated = node.type(node.props);
      const found = findElement(evaluated, predicate);
      if (found) return found;
    } catch (_error) {}
  }
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
  }
  return null;
};

const getNodeText = (node: any): string => {
  if (node == null || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  if (node.props?.children !== undefined) {
    return getNodeText(node.props.children);
  }
  return '';
};

describe('ProviderDashboardCondoSetupStatusPanels', () => {
  test('renders approved assignment completion state', () => {
    const tree = ProviderDashboardCondoSetupStatusPanels({
      myCondo: undefined,
      myAssignments: [
        {
          status: 'APPROVED',
          condominium: { name: 'Residencial Aurora' },
        },
      ],
      onNavigateDashboard: () => {},
      onRefetchAssignments: () => {},
      onRefetchCondo: () => {},
    });

    expect(getNodeText(tree)).toContain('Ir para o Painel');
  });

  test('renders pending assignment status card with refetch action', () => {
    const tree = ProviderDashboardCondoSetupStatusPanels({
      myCondo: undefined,
      myAssignments: [
        {
          status: 'PENDING',
          condominium: {
            name: 'Residencial Aurora',
            city: 'São Paulo',
            state: 'SP',
          },
          unitInfo: 'Bloco B, Apto 104',
          proofOfResidency: 'https://example.test/proof.pdf',
        },
      ],
      onNavigateDashboard: () => {},
      onRefetchAssignments: () => {},
      onRefetchCondo: () => {},
    });

    expect(getNodeText(tree)).toContain('Atualizar Status');
    expect(
      findElement(
        tree,
        (element) => element.props?.href === 'https://example.test/proof.pdf',
      ),
    ).toBeTruthy();
  });

  test('renders pending condo status card with refetch action', () => {
    const tree = ProviderDashboardCondoSetupStatusPanels({
      myCondo: {
        status: 'PENDING_APPROVAL',
        name: 'Condomínio Vista Alegre',
        city: 'São Paulo',
        state: 'SP',
        cep: '01000-000',
        proofUrl: 'https://example.test/condo-proof.pdf',
      },
      myAssignments: [],
      onNavigateDashboard: () => {},
      onRefetchAssignments: () => {},
      onRefetchCondo: () => {},
    });

    expect(getNodeText(tree)).toContain('Atualizar Status');
    expect(
      findElement(
        tree,
        (element) =>
          element.props?.href === 'https://example.test/condo-proof.pdf',
      ),
    ).toBeTruthy();
  });

  test('returns null when no status panel applies', () => {
    expect(
      ProviderDashboardCondoSetupStatusPanels({
        myCondo: undefined,
        myAssignments: [],
        onNavigateDashboard: () => {},
        onRefetchAssignments: () => {},
        onRefetchCondo: () => {},
      }),
    ).toBeNull();
  });
});
