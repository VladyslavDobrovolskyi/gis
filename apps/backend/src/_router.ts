import { router } from './trpc';
import { cityRouter } from './routers/city.router';
import { countryRouter } from './routers/country.router';
import { regionRouter } from './routers/region.router';

export const appRouter = router({
  cities: cityRouter,
  countries: countryRouter,
  regions: regionRouter,
});

export type AppRouter = typeof appRouter;
