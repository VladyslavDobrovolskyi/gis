import { test, expect } from '@playwright/test';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';

/* Presence checks for key admin geometry entries */

test.describe('Map Editing', () => {
  test.describe('Layers Presence', () => {
    /* Allure epic/feature moved into per-test beforeEach to ensure runtime availability */

    test.describe('Presence checks', () => {
      test.beforeEach(() => {
        /* Per-test metadata for Allure reporting */
        allure.epic('Map Editing');
        allure.feature('Data Presence');
        allure.story('Presence checks');
        allure.tag('e2e');
        allure.severity(allure.Severity.NORMAL);
      });

      test('Strict presence checks: Kyiv, Ukraine, known regions', async ({ page }) => {
        const map = new MapWrapper(page);

        await test.step('Open app and ensure map is ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        await test.step('Gather presence flags and assert known entities', async () => {
          const flags = await page.evaluate(() => {
            const w = window as unknown as Window & { __DATA__?: unknown };
            const data = w.__DATA__ || {};
            const cities = Array.isArray((data as Record<string, unknown>)['citiesWithCoords'])
              ? ((data as Record<string, unknown>)['citiesWithCoords'] as unknown[])
              : [];
            const countries = Array.isArray(
              (data as Record<string, unknown>)['countriesWithCoords'],
            )
              ? ((data as Record<string, unknown>)['countriesWithCoords'] as unknown[])
              : [];
            const regions = Array.isArray((data as Record<string, unknown>)['regionsWithCoords'])
              ? ((data as Record<string, unknown>)['regionsWithCoords'] as unknown[])
              : [];

            const normalize = (s: unknown) => (s ? String(s).toLowerCase().trim() : '');

            const cityNames = cities.map((c: unknown) => {
              const obj = c as Record<string, unknown>;
              return normalize(obj['city_name'] ?? obj['name'] ?? obj['title']);
            });

            const countryNames = countries.map((c: unknown) => {
              const obj = c as Record<string, unknown>;
              return normalize(obj['name'] ?? obj['title']);
            });

            const regionNames = regions.map((r: unknown) => {
              const obj = r as Record<string, unknown>;
              return normalize(obj['name'] ?? obj['title']);
            });

            return {
              hasKyiv: cityNames.includes('kyiv'),
              hasUkraine: countryNames.includes('ukraine'),
              hasKnownRegion:
                regionNames.includes('kherson oblast') ||
                regionNames.includes('kyiv oblast') ||
                regionNames.includes('volyn oblast'),
              cityNames: cityNames.slice(0, 50),
              countryNames: countryNames.slice(0, 50),
              regionNames: regionNames.slice(0, 50),
            };
          });

          /* Attach collected presence flags for debugging and Allure traceability */
          test.info().attach('presence-flags.json', {
            body: JSON.stringify(flags, null, 2),
            contentType: 'application/json',
          });

          expect(flags.hasKyiv).toBe(true);
          expect(flags.hasUkraine).toBe(true);
          expect(flags.hasKnownRegion).toBe(true);
        });
      });
    });
  });
});
