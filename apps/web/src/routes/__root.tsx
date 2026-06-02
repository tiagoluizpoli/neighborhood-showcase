import { env } from '@neighborhood-showcase/env/web';
import { Toaster } from '@neighborhood-showcase/ui/components/sonner';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import FlagProvider from '@unleash/proxy-client-react';
import Header from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import type { trpc } from '@/utils/trpc';

import '../index.css';

const unleashConfig = {
  url: env.VITE_UNLEASH_URL,
  clientKey: env.VITE_UNLEASH_CLIENT_KEY,
  appName: 'neighborhood-showcase',
};

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: 'Neighborhood Showcase',
      },
      {
        name: 'description',
        content: 'Neighborhood Showcase is a web application',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),
});

function RootComponent() {
  return (
    <FlagProvider config={unleashConfig}>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Header />
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </FlagProvider>
  );
}
