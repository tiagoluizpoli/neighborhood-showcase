import { describe, expect, test } from 'bun:test';

const { ProviderDashboardHeader } = await import(
  './-provider-dashboard-header'
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

describe('ProviderDashboardHeader', () => {
  test('renders the title, greeting, and create action', () => {
    const tree = ProviderDashboardHeader({
      displayName: 'Tiago Poli',
    });

    const content = textContent(tree);

    expect(content.includes('Painel do Provedor')).toBe(true);
    expect(content.includes('Tiago Poli')).toBe(true);
    expect(content.includes('Criar Anúncio')).toBe(true);
  });
});
