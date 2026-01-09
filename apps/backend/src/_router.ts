import { router } from './trpc';
import { citiesRouter } from './routers/cities.router';
import { countriesRouter } from './routers/countries.router';
import { regionsRouter } from './routers/regions.router';

export const appRouter = router({
  cities: citiesRouter,
  countries: countriesRouter,
  regions: regionsRouter,
});

export type AppRouter = typeof appRouter;
