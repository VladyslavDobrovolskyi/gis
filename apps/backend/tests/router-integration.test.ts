import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as allure from 'allure-js-commons';
import { citiesRouter } from '@/routers/cities.router';
import { countriesRouter } from '@/routers/countries.router';
import { regionsRouter } from '@/routers/regions.router';
import * as dbRunner from '@db/runner';

const createCaller = <T extends { createCaller: (ctx: object | (() => object)) => unknown }>(
  router: T,
): ReturnType<T['createCaller']> => {
  return router.createCaller({} as object) as ReturnType<T['createCaller']>;
};

const callers = {
  Cities: createCaller(citiesRouter),
  Countries: createCaller(countriesRouter),
  Regions: createCaller(regionsRouter),
};

describe('Integration with runQuery', () => {
  beforeEach(() => {
    allure.feature('Integration');
    allure.severity('Normal');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cities Router', () => {
    beforeAll(() => {
      allure.epic('Cities');
      allure.feature('Cities Procedures');
    });

    it('GetCities: calls runQuery without filter parameters', async () => {
      const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([]);

      await callers.Cities.getCities();

      expect(spy).toHaveBeenCalled();
      const args = spy.mock.calls[0];
      expect(args[0]).toEqual(expect.any(Object));
      expect(args[1]).toBeUndefined();
    });

    it('GetCityById: calls runQuery with correct ogc_fid', async () => {
      const mockResult = [{ ogc_fid: 1, city_name: 'Test', region_id: 1, geom: null }];
      const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce(mockResult);

      await callers.Cities.getCityById({ ogc_fid: 1 });

      expect(spy).toHaveBeenCalledWith(expect.any(Object), { ogc_fid: 1 });
    });
  });

  describe('Countries Router', () => {
    beforeAll(() => {
      allure.epic('Countries');
      allure.feature('Countries Procedures');
    });

    it('GetCountries: calls runQuery without parameters', async () => {
      const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([]);

      await callers.Countries.getCountries();

      expect(spy).toHaveBeenCalled();
      const args = spy.mock.calls[0];
      expect(args[0]).toEqual(expect.any(Object));
      expect(args[1]).toBeUndefined();
    });

    it('GetCountryById: calls runQuery with correct ogc_fid', async () => {
      const mockResult = [
        {
          ogc_fid: 1,
          name: 'Test',
          iso_code: 'TC',
          shape_id: null,
          group_code: null,
          type: null,
          geom: null,
        },
      ];
      const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce(mockResult);

      await callers.Countries.getCountryById({ ogc_fid: 1 });

      expect(spy).toHaveBeenCalledWith(expect.any(Object), { ogc_fid: 1 });
    });
  });

  describe('Regions Router', () => {
    beforeAll(() => {
      allure.epic('Regions');
      allure.feature('Regions Procedures');
    });

    it('GetRegions: calls runQuery without parameters', async () => {
      const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([]);

      await callers.Regions.getRegions();

      expect(spy).toHaveBeenCalled();
      const args = spy.mock.calls[0];
      expect(args[0]).toEqual(expect.any(Object));
      expect(args[1]).toBeUndefined();
    });

    afterAll(async () => {
      await dbRunner.shutdown();
    });

    it('GetRegionById: calls runQuery with correct ogc_fid', async () => {
      const mockResult = [
        {
          ogc_fid: 1,
          name: 'Test',
          iso_code: 'TR',
          shape_id: null,
          group_code: null,
          type: null,
          geom: null,
        },
      ];
      const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce(mockResult);

      await callers.Regions.getRegionById({ ogc_fid: 1 });

      expect(spy).toHaveBeenCalledWith(expect.any(Object), { ogc_fid: 1 });
    });
  });
});
