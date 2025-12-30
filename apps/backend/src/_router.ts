import { router } from './trpc';
import { geoRouter } from './routers/geo.router';

export const appRouter = router({
  geo: geoRouter,
});

export type AppRouter = typeof appRouter;
