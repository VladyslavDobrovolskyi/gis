import { test, expect } from '@playwright/test';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';
import type { Feature, Polygon } from 'geojson';

/*
  Delete tests ensure shapes can be removed via context (right) click or UI
  delete flows. These tests use MapWrapper API-based helpers to keep interactions
  stable and deterministic.
*/
test.describe('Map Editing', () => {
  test.beforeEach(() => {
    allure.epic('Map Editing');
  });

  test.describe('Deletion Tools', () => {
    test.beforeEach(() => {
      allure.feature('Deletion Tools');
    });

    test.describe('Delete rectangle', () => {
      test.beforeEach(() => {
        allure.story('Delete rectangle via context menu');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('User can delete the last created rectangle via right-click', async ({ page }) => {
        const map = new MapWrapper(page);

        await test.step('Open app and ensure map ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        let before: number;
        let afterCreate: number;
        let center: { lat: number; lng: number };
        let geo: Feature<Polygon> | null = null;

        await test.step('Create a rectangle via API', async () => {
          before = await map.getDrawnCount();
          center = await map.getCenterLatLng();

          const created: Feature<Polygon> | null = await map.createRectangle(
            [center.lat, center.lng],
            0.5,
          );
          expect(created).not.toBeNull();
          if (!created) throw new Error('createRectangle returned null');
          geo = created;

          await map.waitForDrawnCountGreaterThan(before);
          afterCreate = await map.getDrawnCount();
          expect(afterCreate).toBeGreaterThan(before);

          /* Attach created geojson for Allure traceability */
          test.info().attach('created-rectangle-geo.json', {
            body: JSON.stringify(geo, null, 2),
            contentType: 'application/json',
          });
        });

        await test.step('Delete the rectangle via context menu and verify removal', async () => {
          await map.deleteLastDrawnByContextClick();
          await map.waitForDrawnCountLessThan(afterCreate);

          const afterDelete = await map.getDrawnCount();
          expect(afterDelete).toBe(before);
        });
      });
    });
  });
});
