import { describe, it, expect } from '@jest/globals';
import * as allure from 'allure-js-commons';
import { appRouter } from '@/_router';
import { citiesRouter } from '@/routers/cities.router';
import { countriesRouter } from '@/routers/countries.router';
import { regionsRouter } from '@/routers/regions.router';

describe('App Router', () => {
  beforeAll(() => {
    allure.epic('AppRouter');
    allure.feature('Structure');
  });

  it('Exports all main routers', () => {
    allure.severity('Blocker');
    expect(appRouter).toHaveProperty('cities');
    expect(appRouter).toHaveProperty('countries');
    expect(appRouter).toHaveProperty('regions');
  });

  it('Routers match exported objects', () => {
    allure.severity('Critical');

    expect((appRouter.cities as any).getCities).toBeDefined();
    expect((citiesRouter as any).getCities).toBeDefined();
    expect((appRouter.cities as any).getCityById).toBeDefined();
    expect((citiesRouter as any).getCityById).toBeDefined();

    expect((appRouter.countries as any).getCountries).toBeDefined();
    expect((countriesRouter as any).getCountries).toBeDefined();
    expect((appRouter.countries as any).getCountryById).toBeDefined();
    expect((countriesRouter as any).getCountryById).toBeDefined();

    expect((appRouter.regions as any).getRegions).toBeDefined();
    expect((regionsRouter as any).getRegions).toBeDefined();
    expect((appRouter.regions as any).getRegionById).toBeDefined();
    expect((regionsRouter as any).getRegionById).toBeDefined();
  });
});
