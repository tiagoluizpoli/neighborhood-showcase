import { describe, expect, test } from 'bun:test';

const { ProviderDashboardShellBoundary } = await import(
  './-provider-dashboard-shell-boundary'
);

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

describe('ProviderDashboardShellBoundary', () => {
  test('renders loading state', () => {
    const tree = ProviderDashboardShellBoundary({
      dashboardQuery: {
        data: undefined,
        isError: false,
        isLoading: true,
      },
      renderContent: () => <div>conteudo</div>,
    });

    const content = textContent(tree);

    expect(content.includes('Carregando painel do provedor')).toBe(true);
  });

  test('renders error state', () => {
    const tree = ProviderDashboardShellBoundary({
      dashboardQuery: {
        data: undefined,
        isError: true,
        isLoading: false,
      },
      renderContent: () => <div>conteudo</div>,
    });

    const content = textContent(tree);

    expect(content.includes('Erro ao carregar dados')).toBe(true);
  });

  test('renders content only when data exists', () => {
    let renderContentCalled = false;

    const tree = ProviderDashboardShellBoundary({
      dashboardQuery: {
        data: {},
        isError: false,
        isLoading: false,
      },
      renderContent: () => {
        renderContentCalled = true;
        return <div>conteudo</div>;
      },
    });

    const content = textContent(tree);

    expect(renderContentCalled).toBe(true);
    expect(content.includes('conteudo')).toBe(true);
  });
});
