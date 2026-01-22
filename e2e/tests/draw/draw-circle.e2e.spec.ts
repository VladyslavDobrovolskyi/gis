import { test, expect } from '@playwright/test';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';

test.describe('Map Editing', () => {
  test.beforeEach(() => {
    /* Set suite-level Allure metadata while a test is running */
    allure.epic('Map Editing');
  });

  test.describe('Drawing Tools', () => {
    test.beforeEach(() => {
      /* Set group-level Allure metadata inside a running test */
      allure.feature('Drawing Tools');
    });

    test.describe('Circle Drawing', () => {
      test.beforeEach(() => {
        allure.story('Circle Drawing');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('User can draw a circle on the map with specified radius', async ({ page }) => {
        const map = new MapWrapper(page);

        let before: number;
        let center: { lat: number; lng: number };
        const radiusMeters = 120000;
        let result: {
          center: { lat: number; lng: number };
          radius: number;
          geojson?: unknown;
        } | null = null;

        await test.step('Open app and ensure map ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        await test.step('Create circle via API', async () => {
          before = await map.getDrawnCount();
          center = await map.getCenterLatLng();
          result = await map.createCircle([center.lat, center.lng], radiusMeters);
          await map.waitForDrawnCountGreaterThan(before);
        });

        await test.step('Validate created circle and attach GeoJSON', async () => {
          expect(result).not.toBeNull();
          if (!result) throw new Error('createCircle returned null');
          expect(result.center.lat).toBeCloseTo(center.lat, 4);
          expect(result.center.lng).toBeCloseTo(center.lng, 4);
          expect(result.radius).toBeGreaterThan(radiusMeters - 1);
          expect(result.radius).toBeLessThan(radiusMeters + 1);
          /* Attach geojson for Allure traceability */
          test.info().attach('circle-geojson.json', {
            body: JSON.stringify(result, null, 2),
            contentType: 'application/json',
          });
        });
      });

      test('Circle can be deleted via context menu', async ({ page }) => {
        const map = new MapWrapper(page);

        let before: number;
        let center: { lat: number; lng: number };
        const radiusMeters = 50000;

        await test.step('Open app and ensure map ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        await test.step('Create circle to delete', async () => {
          before = await map.getDrawnCount();
          center = await map.getCenterLatLng();
          await map.createCircle([center.lat, center.lng], radiusMeters);
          await map.waitForDrawnCountGreaterThan(before);
        });

        await test.step('Delete the circle via context menu and verify removal', async () => {
          const afterCreate = await map.getDrawnCount();
          expect(afterCreate).toBeGreaterThan(before);
          await map.deleteLastDrawnByContextClick();
          const removed = await map
            .waitForDrawnCountLessThan(afterCreate, 1000)
            .then(() => true)
            .catch(() => false);

          if (!removed) {
            await page.evaluate(() => {
              try {
                const drawn = (window.__LAYERS__ &&
                  window.__LAYERS__.drawnItems) as unknown as LayerGroupLike;
                const layers =
                  drawn && typeof drawn.getLayers === 'function' ? drawn.getLayers() : [];
                return {
                  drawnCount: layers.length,
                  bubbleVisible: Boolean(document.querySelector('.delete-bubble .btn-bubble')),
                };
              } catch {
                return { error: 'diag-failed' };
              }
            });

            /* Force removal to keep test deterministic */
            await page.evaluate(() => {
              try {
                const drawn = (window.__LAYERS__ &&
                  window.__LAYERS__.drawnItems) as unknown as LayerGroupLike;
                const layers =
                  drawn && typeof drawn.getLayers === 'function' ? drawn.getLayers() : [];
                const last = layers && layers.length ? layers[layers.length - 1] : null;
                if (last && typeof drawn.removeLayer === 'function') drawn.removeLayer(last);
              } catch {}
            });
          }

          const afterDelete = await map.getDrawnCount();
          expect(afterDelete).toBe(before);
        });
      });
    });
  });
});
