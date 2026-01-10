import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import * as allure from 'allure-js-commons';
import * as dbRunner from '@db/runner';
import { citiesRouter } from '@/routers/cities.router';
import { countriesRouter } from '@/routers/countries.router';
import { regionsRouter } from '@/routers/regions.router';
import { appRouter } from '@/_router';
import { CitySchema, CitiesSchema, CountriesSchema, RegionSchema } from '@gis/shared/schemas';

const citiesCaller = citiesRouter.createCaller({});
const countriesCaller = countriesRouter.createCaller({});
const regionsCaller = regionsRouter.createCaller({});
const appCaller = appRouter.createCaller({});

describe('tRPC / Router contract tests', () => {
  beforeAll(() => {
    allure.epic('tRPC');
    allure.feature('Router Contracts');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Cities.getCities returns array matching CitiesSchema', async () => {
    const mockResult = [{ ogc_fid: 1, city_name: 'T1', region_id: 2, geom: null }];

    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce(mockResult as any);

    const res = await citiesCaller.getCities();

    expect(spy).toHaveBeenCalled();
    expect(res).toEqual(mockResult);

    const parsed = CitiesSchema.safeParse(res);
    expect(parsed.success).toBe(true);

    spy.mockRestore();
  });

  it('Cities.getCityById returns single city matching CitySchema', async () => {
    const mockCity = { ogc_fid: 2, city_name: 'T2', region_id: 3, geom: null };
    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([mockCity] as any);

    const res = await citiesCaller.getCityById({ ogc_fid: 2 });

    expect(spy).toHaveBeenCalled();
    expect(res).toEqual(mockCity);

    const parsed = CitySchema.safeParse(res);
    expect(parsed.success).toBe(true);

    spy.mockRestore();
  });

  it('Countries.getCountries and Country schema match', async () => {
    const mockResult = [
      {
        ogc_fid: 1,
        name: 'C1',
        iso_code: 'TC',
        shape_id: null,
        group_code: null,
        type: null,
        geom: null,
      },
    ];
    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce(mockResult as any);

    const res = await countriesCaller.getCountries();

    expect(spy).toHaveBeenCalled();
    expect(res).toEqual(mockResult);

    const parsed = CountriesSchema.safeParse(res);
    expect(parsed.success).toBe(true);

    spy.mockRestore();
  });

  it('Regions.getRegionById returns single region matching RegionSchema', async () => {
    const mockRegion = {
      ogc_fid: 5,
      name: 'R1',
      iso_code: 'TR',
      shape_id: null,
      group_code: null,
      type: null,
      geom: null,
    };
    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce([mockRegion] as any);

    const res = await regionsCaller.getRegionById({ ogc_fid: 5 });

    expect(spy).toHaveBeenCalled();
    expect(res).toEqual(mockRegion);

    const parsed = RegionSchema.safeParse(res);
    expect(parsed.success).toBe(true);

    spy.mockRestore();
  });

  it('Root appRouter proxies to nested routers (cities)', async () => {
    const mockResult = [{ ogc_fid: 7, city_name: 'ProxyCity', region_id: 1, geom: null }];
    const spy = jest.spyOn(dbRunner, 'runQuery').mockResolvedValueOnce(mockResult as any);

    const res = await appCaller.cities.getCities();

    expect(spy).toHaveBeenCalled();
    const parsed = CitiesSchema.safeParse(res);
    expect(parsed.success).toBe(true);

    spy.mockRestore();
  });
});
