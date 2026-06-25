import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { requireDefaultProviderId } from './panel/provider/-resolve-active-provider';

const providerIndexSearchSchema = z.object({
  message: z.string().optional(),
});

export const Route = createFileRoute('/panel/provider/')({
  validateSearch: (search) => providerIndexSearchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    const providerId = await requireDefaultProviderId();
    throw redirect({
      to: '/panel/provider/$providerId',
      params: { providerId },
      search: { message: search.message },
    });
  },
});
