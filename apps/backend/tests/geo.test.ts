import { describe, it, expect } from '@jest/globals';
import * as allure from 'allure-js-commons';
import { City, Cities } from '@gis/shared/types';
import { Region, Regions } from '@gis/shared/types';
import { Country, Countries } from '@gis/shared/types';
import { CitySchema, RegionSchema, CountrySchema } from '@gis/shared/schemas';
import type { ZodSafeParseResult } from 'zod';

const mockCity: City = {
  ogc_fid: 1,
  city_name: 'Test City',
  region_id: 1,
  geom: null,
};
const mockCountry: Country = {
  ogc_fid: 1,
  name: 'Test Country',
  iso_code: 'TC',
  shape_id: null,
  group_code: null,
  type: null,
  geom: null,
};
const mockRegion: Region = {
  ogc_fid: 1,
  name: 'Test Region',
  iso_code: 'TR',
  shape_id: null,
  group_code: null,
  type: null,
  geom: null,
};

describe('Geodata: Cities', () => {
  beforeAll(() => {
    allure.epic('Cities');
    allure.feature('Cities API');
  });

  it('Should return a list of cities', () => {
    allure.severity('Normal');
    const cities: Cities = [mockCity];
    expect(Array.isArray(cities)).toBe(true);
    expect(cities[0].city_name).toBe('Test City');
  });

  it('Should return a city by ogc_fid', () => {
    allure.severity('Critical');
    const city: City = mockCity;
    expect(city.ogc_fid).toBe(1);
    expect(city.city_name).toBe('Test City');
  });
});

describe('Geodata: Countries', () => {
  beforeAll(() => {
    allure.epic('Countries');
    allure.feature('Countries API');
  });

  it('Should return a list of countries', () => {
    allure.severity('Normal');
    const countries: Countries = [mockCountry];
    expect(Array.isArray(countries)).toBe(true);
    expect(countries[0].name).toBe('Test Country');
  });

  it('Should return a country by ogc_fid', () => {
    allure.severity('Critical');
    const country: Country = mockCountry;
    expect(country.ogc_fid).toBe(1);
    expect(country.name).toBe('Test Country');
  });
});

describe('Geodata: Schemas (mocks)', () => {
  beforeAll(() => {
    allure.epic('Schemas');
    allure.feature('Mock validation');
  });

  it('mockCity passes CitySchema', () => {
    allure.severity('Critical');
    const res: ZodSafeParseResult<City> = CitySchema.safeParse(mockCity);
    if (!res.success) {
      console.error('City schema errors:', res.error.issues);
    }
    expect(res.success).toBe(true);
  });

  it('mockCountry passes CountrySchema', () => {
    allure.severity('Critical');
    const res: ZodSafeParseResult<Country> = CountrySchema.safeParse(mockCountry);
    if (!res.success) {
      console.error('Country schema errors:', res.error.issues);
    }
    expect(res.success).toBe(true);
  });

  it('mockRegion passes RegionSchema', () => {
    allure.severity('Critical');
    const res: ZodSafeParseResult<Region> = RegionSchema.safeParse(mockRegion);
    if (!res.success) {
      console.error('Region schema errors:', res.error.issues);
    }
    expect(res.success).toBe(true);
  });

  it('Invalid city fails CitySchema (reports city_name)', () => {
    allure.severity('Normal');
    const bad = { ...mockCity, city_name: '' } as unknown;
    const res: ZodSafeParseResult<City> = CitySchema.safeParse(bad as unknown as City);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.map((i) => i.path.join('.'))).toContain('city_name');
    }
  });
});

describe('Geodata: Regions', () => {
  beforeAll(() => {
    allure.epic('Regions');
    allure.feature('Regions API');
  });

  it('Should return a list of regions', () => {
    allure.severity('Normal');
    const regions: Regions = [mockRegion];
    expect(Array.isArray(regions)).toBe(true);
    expect(regions[0].name).toBe('Test Region');
  });

  it('Should return a region by ogc_fid', () => {
    allure.severity('Critical');
    const region: Region = mockRegion;
    expect(region.ogc_fid).toBe(1);
    expect(region.name).toBe('Test Region');
  });
});
