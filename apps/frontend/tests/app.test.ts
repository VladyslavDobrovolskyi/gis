import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import * as allure from 'allure-js-commons';
import { ZodSafeParseResult } from 'zod';

import { createPinia } from 'pinia';
import { mockCities, mockCountries, mockRegions } from '@gis/shared/testing';

import { VueQueryPlugin } from '@tanstack/vue-query';
import type { City, Country, Region } from '@gis/shared/types';
import { CitySchema, CountrySchema, RegionSchema } from '@gis/shared/schemas';

// Use shared fixtures
// mockCities, mockCountries, mockRegions imported from '@gis/shared/testing/fixtures' above

vi.mock('@/trpc', () => ({
  trpc: {
    cities: { getCities: { query: async () => mockCities } },
    countries: { getCountries: { query: async () => mockCountries } },
    regions: { getRegions: { query: async () => mockRegions } },
  },
}));

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------
 * Application
 * ------------------------------------------------------------------ */

describe('Application', () => {
  beforeAll(() => {
    allure.epic('Frontend');
    allure.feature('App Rendering');
  });

  it('Mounts App Without Errors', async () => {
    allure.severity('Critical');
    const { default: App } = await import('@/App.vue');

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), VueQueryPlugin],
        stubs: {
          LMap: { template: '<div />' },
          LTileLayer: { template: '<div />' },
          LPolygon: { template: '<div />' },
          MeasurementBadge: { template: '<div />' },
          DeleteBubble: { template: '<div />' },
          Loader: { template: '<div />' },
        },
      },
    });

    // Check component exists after mount
    expect(wrapper.exists()).toBe(true);
  });

  it('Mocked data conforms to shared schemas', () => {
    allure.severity('Normal');

    const city: City = mockCities[0];
    const country: Country = mockCountries[0];
    const region: Region = mockRegions[0];

    const cityRes: ZodSafeParseResult<City> = CitySchema.safeParse(city);
    const countryRes: ZodSafeParseResult<Country> = CountrySchema.safeParse(country);
    const regionRes: ZodSafeParseResult<Region> = RegionSchema.safeParse(region);

    expect(cityRes.success).toBe(true);
    expect(countryRes.success).toBe(true);
    expect(regionRes.success).toBe(true);
  });
});
