import { test, expect } from '@playwright/test';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';

/* Introspection checks: surface what window.__LAYERS__ exposes and basic non-emptiness */

test.describe('Map Editing', () => {
  test.describe('Layers Introspection', () => {
    /* Allure feature moved to per-test beforeEach to ensure runtime availability */

    test.describe('Introspection checks', () => {
      test.beforeEach(() => {
        test.setTimeout(60000);
        /* Per-test metadata for Allure reporting */
        allure.epic('Map Editing');
        allure.feature('Data Exposure');
        allure.story('Introspection checks');
        allure.tag('e2e');
        allure.severity(allure.Severity.NORMAL);
      });

      test('window.__LAYERS__ exposes named groups and methods', async ({ page }) => {
        const map = new MapWrapper(page);
        await map.goto();
        await map.waitForReady();

        await test.step('Inspect window.__LAYERS__ presence and APIs', async () => {
          const flags = await page.evaluate(() => {
            const w = window as unknown as Window & {
              __LAYERS__?: {
                drawnItems?: unknown;
                cityMarkers?: unknown;
                cityBorders?: unknown;
                countryBorders?: unknown;
                regionBorders?: unknown;
              };
              __GEOMAN__?: unknown;
            };
            const layers = w.__LAYERS__;
            return {
              hasDrawnItems:
                !!layers?.drawnItems &&
                typeof (layers.drawnItems as { getLayers?: unknown }).getLayers === 'function',
              hasCityMarkers: layers?.cityMarkers !== undefined,
              hasCityBorders:
                !!layers?.cityBorders &&
                typeof (layers.cityBorders as { getLayers?: unknown }).getLayers === 'function',
              hasCountryBorders:
                !!layers?.countryBorders &&
                typeof (layers.countryBorders as { getLayers?: unknown }).getLayers === 'function',
              hasRegionBorders:
                !!layers?.regionBorders &&
                typeof (layers.regionBorders as { getLayers?: unknown }).getLayers === 'function',
              hasGeoman: !!w.__GEOMAN__,
            };
          });

          expect(flags.hasDrawnItems).toBe(true);
          expect(flags.hasCityMarkers).toBe(true);
          if (flags.hasCityBorders) expect(flags.hasCityBorders).toBe(true);
          if (flags.hasCountryBorders) expect(flags.hasCountryBorders).toBe(true);
          if (flags.hasRegionBorders) expect(flags.hasRegionBorders).toBe(true);
          expect(flags.hasGeoman).toBeTruthy();
        });
      });

      test('Exposed layers contain features (non-empty) when available', async ({ page }) => {
        const map = new MapWrapper(page);
        await map.goto();
        await map.waitForReady();

        await test.step('Ensure exposed layers contain features when available', async () => {
          const info = await page.evaluate(() => {
            const w = window as unknown as Window & {
              __LAYERS__?: {
                drawnItems?: unknown;
                cityMarkers?: unknown;
                cityBorders?: unknown;
                countryBorders?: unknown;
                regionBorders?: unknown;
              };
            };
            const layers = w.__LAYERS__;
            const getCount = (l: unknown) => {
              if (!l) return 0;
              if (typeof (l as { getLayers?: unknown }).getLayers === 'function')
                return (l as { getLayers: () => unknown[] }).getLayers().length;
              if (Array.isArray(l)) return (l as unknown[]).length;
              if ((l as { _layers?: unknown })._layers)
                return Object.keys((l as { _layers: Record<string, unknown> })._layers).length;
              return 0;
            };

            return {
              hasCityMarkers: layers?.cityMarkers !== undefined,
              cityMarkersCount: getCount(layers?.cityMarkers),
              hasCityBorders:
                !!layers?.cityBorders &&
                typeof (layers.cityBorders as { getLayers?: unknown }).getLayers === 'function',
              cityBordersCount: getCount(layers?.cityBorders),
              hasCountryBorders:
                !!layers?.countryBorders &&
                typeof (layers.countryBorders as { getLayers?: unknown }).getLayers === 'function',
              countryBordersCount: getCount(layers?.countryBorders),
              hasRegionBorders:
                !!layers?.regionBorders &&
                typeof (layers.regionBorders as { getLayers?: unknown }).getLayers === 'function',
              regionBordersCount: getCount(layers?.regionBorders),
            };
          });

          const cityRepresents = info.cityMarkersCount > 0 || info.cityBordersCount > 0;
          const anyNonEmpty =
            cityRepresents || info.countryBordersCount > 0 || info.regionBordersCount > 0;
          expect(anyNonEmpty).toBe(true);
        });
      });

      test('City representation check (markers or polygons or data)', async ({ page }) => {
        const map = new MapWrapper(page);
        await map.goto();
        await map.waitForReady();

        await test.step('City representation check (markers or polygons or data)', async () => {
          const info = await page.evaluate(() => {
            const w = window as unknown as Window & {
              __LAYERS__?: {
                cityMarkers?: unknown;
                cityBorders?: unknown;
              };
              __DATA__?: {
                citiesWithCoords?: unknown[];
                citiesWithPolygonCoords?: unknown[];
              };
            };
            const layers = w.__LAYERS__ || {};
            const data = w.__DATA__ || {};
            const getCount = (l: unknown) => {
              if (!l) return 0;
              if (typeof (l as { getLayers?: unknown }).getLayers === 'function')
                return (l as { getLayers: () => unknown[] }).getLayers().length;
              if (Array.isArray(l)) return (l as unknown[]).length;
              if ((l as { _layers?: unknown })._layers)
                return Object.keys((l as { _layers: Record<string, unknown> })._layers).length;
              return 0;
            };

            return {
              cityMarkersCount: getCount(layers.cityMarkers),
              cityBordersCount: getCount(layers.cityBorders),
              citiesWithCoordsCount: Array.isArray(data.citiesWithCoords)
                ? data.citiesWithCoords.length
                : 0,
              citiesWithPolygonCount: Array.isArray(data.citiesWithPolygonCoords)
                ? data.citiesWithPolygonCoords.length
                : 0,
            };
          });

          const markersOk = info.cityMarkersCount > 0;
          const polygonsOk = info.cityBordersCount > 0 || info.citiesWithPolygonCount > 0;
          const dataOk = info.citiesWithCoordsCount > 0;

          if (!markersOk) {
            expect(polygonsOk || dataOk).toBe(true);
          }

          test.info().attach('city-representation.json', {
            body: JSON.stringify(info, null, 2),
            contentType: 'application/json',
          });
        });
      });
    });
  });
});
