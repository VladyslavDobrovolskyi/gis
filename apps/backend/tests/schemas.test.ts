import { describe, it, expect } from '@jest/globals';
import * as allure from 'allure-js-commons';
import type { ZodSafeParseResult } from 'zod';
import type { City, Country, Region } from '@gis/shared/types';
import { CitySchema, RegionSchema, CountrySchema } from '@gis/shared/schemas';

describe('Schemas Validation', () => {
  beforeAll(() => {
    allure.epic('Schemas');
    allure.feature('Validation');
  });

  it('Validates correct city', () => {
    allure.severity('Normal');
    const valid: ZodSafeParseResult<City> = CitySchema.safeParse({
      ogc_fid: 1,
      city_name: 'A',
      region_id: 2,
      geom: null,
    });
    expect(valid.success).toBe(true);
  });

  it('Rejects invalid city', () => {
    allure.severity('Critical');
    const invalid: ZodSafeParseResult<City> = CitySchema.safeParse({
      ogc_fid: -1,
      city_name: '',
      region_id: 0,
      geom: null,
    });
    expect(invalid.success).toBe(false);
  });
  it('Validates correct country', () => {
    allure.severity('Normal');
    const valid: ZodSafeParseResult<Country> = CountrySchema.safeParse({
      ogc_fid: 1,
      name: 'B',
      iso_code: 'RU',
      shape_id: null,
      group_code: null,
      type: null,
      geom: null,
    });
    expect(valid.success).toBe(true);
  });

  it('Rejects invalid country', () => {
    allure.severity('Critical');
    const invalid: ZodSafeParseResult<Country> = CountrySchema.safeParse({
      ogc_fid: 0,
      name: '',
      iso_code: 'R',
      shape_id: null,
      group_code: null,
      type: null,
      geom: null,
    });
    expect(invalid.success).toBe(false);
  });
  it('Validates correct region', () => {
    allure.severity('Normal');
    const valid: ZodSafeParseResult<Region> = RegionSchema.safeParse({
      ogc_fid: 1,
      name: 'C',
      iso_code: 'RU',
      shape_id: null,
      group_code: null,
      type: null,
      geom: null,
    });
    expect(valid.success).toBe(true);
  });

  it('Rejects invalid region', () => {
    allure.severity('Critical');
    const invalid: ZodSafeParseResult<Region> = RegionSchema.safeParse({
      ogc_fid: 0,
      name: '',
      iso_code: 'R',
      shape_id: null,
      group_code: null,
      type: null,
      geom: null,
    });
    expect(invalid.success).toBe(false);
  });
});
