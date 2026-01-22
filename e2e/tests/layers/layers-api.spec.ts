import { test, expect } from '@playwright/test';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';
import type { Feature, Polygon } from 'geojson';

/*
  API-side tests that mutate the map and assert stored state.
  These tests create features programmatically (API), attach resulting GeoJSON
  to Allure for traceability, and assert the drawnItems collection reflects changes.
*/

test.describe('Map Editing', () => {
  test.beforeEach(() => {
    /* Set suite-level Allure metadata while a test is running */
    allure.epic('Map Editing');
  });

  test.describe('Layers API', () => {
    test.beforeEach(() => {
      /* Set group-level Allure metadata while a test is running */
      allure.feature('Layers API');
    });

    test.describe('API modifications', () => {
      test.beforeEach(() => {
        allure.story('API modifications');
        allure.tag('e2e');
        allure.severity(allure.Severity.NORMAL);
      });

      test('Adding a polygon via API stores it in drawnItems', async ({ page }) => {
        const map = new MapWrapper(page);

        await test.step('Open app and ensure map ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        let before: number;
        let center: { lat: number; lng: number };
        let geo: Feature<Polygon> | null = null;

        await test.step('Create polygon via API and attach GeoJSON', async () => {
          before = await map.getDrawnCount();
          center = await map.getCenterLatLng();

          const coords: Array<[number, number]> = [
            [center.lat + 0.001, center.lng - 0.001],
            [center.lat + 0.001, center.lng + 0.001],
            [center.lat - 0.0014, center.lng],
          ];

          geo = await map.createPolygon(coords);
          expect(geo).not.toBeNull();
          if (!geo) throw new Error('createPolygon returned null');
          expect(geo).toHaveProperty('type', 'Feature');

          /* Attach created polygon for Allure traceability */
          test.info().attach('api-created-polygon.json', {
            body: JSON.stringify(geo, null, 2),
            contentType: 'application/json',
          });

          await map.waitForDrawnCountGreaterThan(before);
        });

        await test.step('Validate drawnItems contains the new polygon', async () => {
          const drawn = await map.getDrawnGeoJSON();
          expect(drawn).toHaveProperty('type', 'FeatureCollection');

          /* Minimal strong typing for assertions */
          const fc = drawn as { features?: unknown[] } | null;
          expect(Array.isArray(fc?.features)).toBe(true);
          expect((fc?.features?.length ?? 0) > 0).toBe(true);

          /* Attach full drawn feature collection for traceability as well */
          test.info().attach('drawn-featurecollection.json', {
            body: JSON.stringify(drawn, null, 2),
            contentType: 'application/json',
          });
        });
      });
    });
  });
});
