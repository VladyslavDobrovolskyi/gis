import { describe, it, expect, beforeEach } from '@jest/globals';
import * as allure from 'allure-js-commons';
import { citiesRouter } from '@/routers/cities.router';
import { countriesRouter } from '@/routers/countries.router';
import { regionsRouter } from '@/routers/regions.router';
import * as dbRunner from '@db/runner';

const citiesCaller = citiesRouter.createCaller({});
const countriesCaller = countriesRouter.createCaller({});
const regionsCaller = regionsRouter.createCaller({});

describe('Router Error Handling', () => {
  beforeEach(() => {
    allure.feature('Error Handling');
    allure.severity('Critical');
  });

  afterAll(async () => {
    await dbRunner.shutdown();
  });

  it('CitiesRouter: throws if city is not found', async () => {
    allure.epic('Cities');

    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([]);

    await expect(citiesCaller.getCityById({ ogc_fid: 999 })).rejects.toThrow('City not found');

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('CountriesRouter: throws if country is not found', async () => {
    allure.epic('Countries');

    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([]);

    await expect(countriesCaller.getCountryById({ ogc_fid: 999 })).rejects.toThrow(
      'Country not found',
    );

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('RegionsRouter: throws if region is not found', async () => {
    allure.epic('Regions');

    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([]);

    await expect(regionsCaller.getRegionById({ ogc_fid: 999 })).rejects.toThrow('Region not found');

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
