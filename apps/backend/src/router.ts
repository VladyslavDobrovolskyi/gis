import { router } from '@trpc';
import { citiesRouter } from './routers/cities.router';

export const appRouter = router({
  cities: citiesRouter,
});

export type AppRouter = typeof appRouter;
