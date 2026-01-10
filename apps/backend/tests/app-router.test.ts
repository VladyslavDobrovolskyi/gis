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

    expect((appRouter.cities as typeof citiesRouter).getCities).toBeDefined();
    expect((citiesRouter as typeof citiesRouter).getCities).toBeDefined();
    expect((appRouter.cities as typeof citiesRouter).getCityById).toBeDefined();
    expect((citiesRouter as typeof citiesRouter).getCityById).toBeDefined();

    expect((appRouter.countries as typeof countriesRouter).getCountries).toBeDefined();
    expect((countriesRouter as typeof countriesRouter).getCountries).toBeDefined();
    expect((appRouter.countries as typeof countriesRouter).getCountryById).toBeDefined();
    expect((countriesRouter as typeof countriesRouter).getCountryById).toBeDefined();

    expect((appRouter.regions as typeof regionsRouter).getRegions).toBeDefined();
    expect((regionsRouter as typeof regionsRouter).getRegions).toBeDefined();
    expect((appRouter.regions as typeof regionsRouter).getRegionById).toBeDefined();
    expect((regionsRouter as typeof regionsRouter).getRegionById).toBeDefined();
  });
});
