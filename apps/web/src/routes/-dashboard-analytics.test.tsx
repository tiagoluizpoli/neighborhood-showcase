import { describe, expect, test } from 'bun:test';

const { Route: DashboardIndexRoute } = await import('./panel.dashboard.index');

describe('Dashboard index redirect shim', () => {
  test('redirects /panel/dashboard/ to the provider dashboard', () => {
    let result: unknown = null;
    try {
      // biome-ignore lint/style/noNonNullAssertion: shim defines beforeLoad
      DashboardIndexRoute.options.beforeLoad!({} as never);
    } catch (redirectResult) {
      result = redirectResult;
    }
    expect((result as { options?: { to?: string } })?.options?.to).toBe(
      '/panel/dashboard',
    );
  });
});
