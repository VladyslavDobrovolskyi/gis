import { test, expect } from '@playwright/test';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';
import type { Feature, Polygon } from 'geojson';

/*
  Delete shape tests ensure common shapes (circle/etc) created by API helpers can be
  removed via context-menu delete flows. Use API-based creation for stability and attach
  created objects for Allure traceability.
*/

test.describe('Map Editing', () => {
  test.describe('Deletion Tools', () => {
    test.describe('Delete shape', () => {
      test.beforeEach(() => {
        /* Per-test metadata for Allure reporting */
        allure.epic('Map Editing');
        allure.feature('Deletion Tools');
        allure.story('Delete shape via context menu');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('User can delete the last created circle via context menu', async ({ page }) => {
        const map = new MapWrapper(page);

        await test.step('Open app and ensure map is ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        let before: number;
        let center: { lat: number; lng: number };
        const radiusMeters = 120000;
        let created: {
          center: { lat: number; lng: number };
          radius: number;
          geojson: Feature<Polygon>;
        } | null = null;
        let afterCreate: number;

        await test.step('Create circle via API', async () => {
          before = await map.getDrawnCount();
          center = await map.getCenterLatLng();

          created = await map.createCircle([center.lat, center.lng], radiusMeters);
          expect(created).not.toBeNull();
          if (!created) throw new Error('createCircle returned null');

          await map.waitForDrawnCountGreaterThan(before);
          afterCreate = await map.getDrawnCount();
          expect(afterCreate).toBeGreaterThan(before);

          /* Attach created circle object for Allure traceability */
          test.info().attach('created-circle.json', {
            body: JSON.stringify(created, null, 2),
            contentType: 'application/json',
          });
        });

        await test.step('Delete the circle via context menu and verify removal', async () => {
          await map.deleteLastDrawnByContextClick();
          await map.waitForDrawnCountLessThan(afterCreate);

          const afterDelete = await map.getDrawnCount();
          expect(afterDelete).toBe(before);
        });
      });
    });
  });
});
