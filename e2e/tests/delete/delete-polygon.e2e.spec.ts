import { test, expect } from '@playwright/test';
import type { Feature, Polygon } from 'geojson';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';

/* Delete polygon tests:
   Ensure a polygon created via the test API can be removed via right-click.
   Using API-based creation keeps tests stable and non-flaky.
*/

test.describe('Map Editing', () => {
  test.describe('Deletion Tools', () => {
    test.describe('Delete polygon', () => {
      test.beforeEach(() => {
        /* Per-test metadata for Allure reporting */
        allure.epic('Map Editing');
        allure.feature('Deletion Tools');
        allure.story('Delete polygon via context menu');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('User can delete the last created polygon via right-click', async ({ page }) => {
        const map = new MapWrapper(page);

        let before: number;
        let afterCreate: number;
        let center: { lat: number; lng: number };
        let geo: Feature<Polygon> | null = null;

        await test.step('Open app and ensure map is ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        await test.step('Create a small square polygon via API', async () => {
          before = await map.getDrawnCount();
          center = await map.getCenterLatLng();

          /* degrees (~0.006 ≈ ~600m) */
          const size = 0.6 / 100;

          /* Create square around center */
          const coords: Array<[number, number]> = [
            [center.lat - size, center.lng - size],
            [center.lat - size, center.lng + size],
            [center.lat + size, center.lng + size],
            [center.lat + size, center.lng - size],
            [center.lat - size, center.lng - size],
          ];

          geo = await map.createPolygon(coords);
          if (!geo) throw new Error('createPolygon returned null');

          await map.waitForDrawnCountGreaterThan(before);
          afterCreate = await map.getDrawnCount();
          expect(afterCreate).toBeGreaterThan(before);

          /* Attach geojson for Allure traceability */
          test.info().attach('created-polygon-geo.json', {
            body: JSON.stringify(geo, null, 2),
            contentType: 'application/json',
          });
        });

        await test.step('Delete the polygon via context click and verify removal', async () => {
          await map.deleteLastDrawnByContextClick();
          await map.waitForDrawnCountLessThan(afterCreate);

          const afterDelete = await map.getDrawnCount();
          expect(afterDelete).toBe(before);
        });
      });
    });
  });
});
