import { describe, expect, mock, test } from 'bun:test';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { trpc } from '@/utils/trpc';

// Real router (global test-setup stub) + RTL. The layout component renders a
// <PanelContentContainer> around <Outlet/> (stubbed to null globally). Only trpc
// is mocked, full surface, to avoid bun's process-global partial-mock leak.

const trpcMockModule = {
  trpcClient: {
    user: {
      getAccessProfile: {
        query: async () => ({ providerEnabled: true }),
      },
    },
  },
  trpc,
};
mock.module('@/utils/trpc', () => trpcMockModule);
mock.module('../utils/trpc', () => trpcMockModule);

const { Route } = await import('@/routes/panel.provider');

describe('ProviderGroupLayout container seam', () => {
  test('container present with default variant at layout boundary', () => {
    const Layout = Route.options.component as ComponentType;
    const { container } = render(<Layout />);
    const node = container.querySelector('[data-container-variant="default"]');
    expect(node).not.toBeNull();
  });

  test('layout component is exported as a function', () => {
    expect(typeof Route.options.component).toBe('function');
  });
});
