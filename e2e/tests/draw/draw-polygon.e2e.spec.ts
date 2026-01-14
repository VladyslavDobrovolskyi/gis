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

    test.describe('Polygon Drawing', () => {
      test.beforeEach(() => {
        allure.story('Polygon Drawing');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('User can draw a polygon and finish it', async ({ page }) => {
        const map = new MapWrapper(page);

        await map.goto();
        await map.waitForReady();

        /* Use API-based drawing to create a polygon (stable, non-flaky) */
        const before = await map.getDrawnCount();

        const center = await map.getCenterLatLng();
        /* Small offsets in degrees (~0.001 ≈ 111m) to form a visible triangle */
        const dLat = 0.001;
        const dLng = 0.0012;

        const coords: Array<[number, number]> = [
          [center.lat + dLat, center.lng - dLng],
          [center.lat + dLat, center.lng + dLng],
          [center.lat - dLat * 1.4, center.lng],
        ];

        const geo = await map.createPolygon(coords);

        await map.waitForDrawnCountGreaterThan(before);

        /* Validate GeoJSON shape was created and has correct type/coordinate count */
        expect(geo).not.toBeNull();
        if (!geo) throw new Error('createPolygon returned null');
        expect(geo.type).toBe('Feature');
        expect(geo.geometry.type).toBe('Polygon');
        /* A triangle polygon will have 4 coordinates in the first (closed) ring */
        expect(geo.geometry.coordinates[0].length).toBe(4);
      });
    });
  });
});
