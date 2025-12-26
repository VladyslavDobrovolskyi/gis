import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { type AppRouter } from '@gis/backend';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL}/trpc`,
    }),
  ],
});
