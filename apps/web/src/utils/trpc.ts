import type { AppRouter } from '@neighborhood-showcase/api';
import { env } from '@neighborhood-showcase/env/web';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { toast } from 'sonner';

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

const MAX_QUERY_RETRIES = 3;

/**
 * Do not retry on client errors (4xx). A NOT_FOUND or other 4xx is a valid,
 * conclusive answer from the server — retrying just adds latency before the
 * UI can render its error state. Retry only transient failures (network/5xx).
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    const httpStatus = error.data?.httpStatus as number | undefined;
    if (
      typeof httpStatus === 'number' &&
      httpStatus >= 400 &&
      httpStatus < 500
    ) {
      return false;
    }
  }

  return failureCount < MAX_QUERY_RETRIES;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: {
          label: 'retry',
          onClick: query.invalidate,
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.VITE_SERVER_URL}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
