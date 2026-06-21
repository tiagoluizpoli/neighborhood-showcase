import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// @tanstack/react-router Link/useNavigate are stubbed globally in test-setup.ts;
// the stub Link renders an anchor exposing `to`/`hash` as data attributes.

// biome-ignore lint/suspicious/noExplicitAny: session shape varies per test
let mockSession: any = null;
mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: mockSession, isPending: false }),
  },
}));

const { Header } = await import('@/components/header');
const { Footer } = await import('@/components/footer');

const renderWithI18n = (ui: JSX.Element) =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

describe('Public Shell Header & Footer Tests', () => {
  beforeEach(async () => {
    mockSession = null;
    await i18n.changeLanguage('pt');
  });

  test('Logged-out header renders login button and no private links or dashboard', () => {
    const { container } = renderWithI18n(<Header />);

    // Unauthenticated user sees the login link ("Entrar") pointing to /auth
    const loginLink = container.querySelector('[data-to="/auth"]');
    expect(loginLink).not.toBeNull();
    expect(loginLink?.textContent).toBe('Entrar');

    // Does not render dashboard (Painel) links in logged-out mode
    expect(container.querySelector('[data-to="/panel/dashboard"]')).toBeNull();

    // Public shell header stays focused: no theme or language utilities
    expect(screen.queryByText('ModeToggle')).toBeNull();
    expect(screen.queryByText('PT')).toBeNull();
    expect(screen.queryByText('EN')).toBeNull();
  });

  test('Logged-in header renders dashboard link and no login link', () => {
    mockSession = {
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
      },
    };

    const { container } = renderWithI18n(<Header />);

    // Authenticated user sees the dashboard link ("Painel") to /panel/dashboard
    const dashboardLink = container.querySelector(
      '[data-to="/panel/dashboard"]',
    );
    expect(dashboardLink).not.toBeNull();
    expect(dashboardLink?.textContent).toBe('Painel');

    // Does not render login link
    expect(container.querySelector('[data-to="/auth"]')).toBeNull();

    // Public shell header stays focused: no theme or language utilities
    expect(screen.queryByText('ModeToggle')).toBeNull();
    expect(screen.queryByText('PT')).toBeNull();
    expect(screen.queryByText('EN')).toBeNull();
  });

  test('Public header renders navigation anchors to Explorar, Como Funciona, and Anunciar', () => {
    const { container } = renderWithI18n(<Header />);

    for (const hash of ['explorar', 'como-funciona', 'anunciar']) {
      const anchor = container.querySelector(`[data-hash="${hash}"]`);
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('data-to')).toBe('/');
    }
  });

  test('Public footer contains public links and no private links', () => {
    const { container } = renderWithI18n(<Footer />);

    for (const hash of ['explorar', 'como-funciona', 'anunciar']) {
      expect(container.querySelector(`[data-hash="${hash}"]`)).not.toBeNull();
    }

    // Entrar link exists in footer
    expect(container.querySelector('[data-to="/auth"]')).not.toBeNull();

    // No private dashboard or moderator/admin strings/links
    expect(container.querySelector('[data-to="/panel/dashboard"]')).toBeNull();
    expect(container.querySelector('[data-to="/panel/moderation"]')).toBeNull();
  });
});
