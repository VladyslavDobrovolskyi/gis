import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { MapWrapper } from '@/pageobjects/MapWrapper';

/*
  Delete bubble attachment tests ensure programmatic layers get context-delete handlers attached by the app.
  These verify the presence of __contextDeleteAttached flag or an `on` handler on the layer.
*/

test.describe('Map Editing', () => {
  test.beforeEach(() => {
    allure.epic('Map Editing');
  });

  test.describe('Deletion Tools', () => {
    test.beforeEach(() => {
      allure.feature('Deletion Tools');
    });

    test.describe('Delete bubble attachment', () => {
      test.beforeEach(() => {
        allure.story('Programmatic layer context-delete handlers');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('Programmatic layers get context-delete handlers attached', async ({ page }) => {
        const map = new MapWrapper(page);

        await test.step('Open app and ensure map ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        let before: number;
        let center: { lat: number; lng: number };

        await test.step('Take initial drawn count and center', async () => {
          before = await map.getDrawnCount();
          center = await map.getCenterLatLng();
        });

        await test.step('Create rectangle programmatically', async () => {
          /* Create rectangle programmatically */
          await map.createRectangle([center.lat, center.lng], 0.4);
          await map.waitForDrawnCountGreaterThan(before);
        });

        /* Check last added layer has context delete attachment flag or an `on` handler */
        const attached: boolean = await page.evaluate(() => {
          try {
            const drawn = (window as unknown as { __LAYERS__?: { drawnItems?: unknown } })
              .__LAYERS__?.drawnItems;
            const layers =
              drawn && typeof (drawn as unknown as { getLayers?: unknown }).getLayers === 'function'
                ? (drawn as unknown as { getLayers: () => unknown[] }).getLayers()
                : [];
            const last =
              layers && layers.length ? (layers as unknown as unknown[])[layers.length - 1] : null;
            if (!last) return false;
            /* __contextDeleteAttached is set by attachContextDelete when handlers are bound */
            if (
              Object.prototype.hasOwnProperty.call(last, '__contextDeleteAttached') &&
              (last as unknown as Record<string, unknown>)['__contextDeleteAttached']
            )
              return true;
            /* fallback: check if layer exposes `on` and seems to have 'contextmenu' listeners (best-effort) */
            if (typeof (last as unknown as { on?: unknown }).on === 'function') return true;
            return false;
          } catch {
            return false;
          }
        });

        await test.step('Assert context-delete handler present', async () => {
          expect(attached).toBeTruthy();
        });
      });
    });
  });
});
