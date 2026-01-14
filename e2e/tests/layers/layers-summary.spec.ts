import { test, type Page } from '@playwright/test';
import { MapWrapper } from '@/pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';

/*
  Summary & attachments for debugging — non-asserting helpers that produce artifacts.
  These tests collect small samples of layer & admin data and attach them to the test
  results so they are available in Allure for post-mortem inspection.
*/

test.describe('Map Editing', () => {
  test.describe('Layers Summary', () => {
    test.describe('Summary & Data Attachments', () => {
      test.beforeEach(() => {
        test.setTimeout(60000);
        allure.epic('Map Editing');
        allure.feature('Data Summary');
        allure.story('Summary & Data Attachments');
        allure.tag('e2e');
        allure.severity(allure.Severity.MINOR);
      });

      test('Log layer contents for inspection', async ({ page }: { page: Page }) => {
        const map = new MapWrapper(page);

        await test.step('Open app and ensure map is ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        await test.step('Collect layer summary and attach to test info', async () => {
          const summary = await page.evaluate(() => {
            /* Safely read layer groups exposed on window and produce small samples */
            const w = window as unknown as Window & { __LAYERS__?: unknown };
            const layers = w.__LAYERS__ ?? {};

            const getLayersArray = (l: unknown): unknown[] => {
              if (!l) return [];
              if (typeof (l as { getLayers?: unknown }).getLayers === 'function')
                return (l as { getLayers: () => unknown[] }).getLayers();
              if (Array.isArray(l)) return l as unknown[];
              const maybe = l as { _layers?: Record<string, unknown> };
              if (maybe._layers) return Object.values(maybe._layers);
              return [];
            };

            const summarize = (l: unknown) => {
              const arr = getLayersArray(l);
              return {
                count: arr.length,
                sample: arr.slice(0, 5).map((layer: unknown) => {
                  const layerObj = layer as {
                    feature?: unknown;
                    toGeoJSON?: () => unknown;
                    options?: Record<string, unknown>;
                    constructor?: { name?: string };
                    getLatLng?: unknown;
                  };
                  const f =
                    layerObj.feature ??
                    (typeof layerObj.toGeoJSON === 'function' ? layerObj.toGeoJSON!() : null);
                  const props =
                    (f as { properties?: Record<string, unknown> })?.properties ||
                    layerObj.options ||
                    {};
                  const name =
                    (props && (props as Record<string, unknown>).name) ??
                    (props && (props as Record<string, unknown>).title) ??
                    (props && (props as Record<string, unknown>).id) ??
                    null;
                  const type =
                    (f as { geometry?: { type?: string } })?.geometry?.type ??
                    (typeof layerObj.getLatLng === 'function'
                      ? 'Marker'
                      : layerObj.constructor?.name || 'Layer');
                  return { name, type, props };
                }),
              };
            };

            return {
              cityMarkers: summarize((layers as Record<string, unknown>).cityMarkers),
              cityBorders: summarize((layers as Record<string, unknown>).cityBorders),
              countryBorders: summarize((layers as Record<string, unknown>).countryBorders),
              regionBorders: summarize((layers as Record<string, unknown>).regionBorders),
            };
          });

          test.info().attach('layer-summary.json', {
            body: JSON.stringify(summary, null, 2),
            contentType: 'application/json',
          });
        });
      });

      test('Log admin data (cities/countries/regions) for inspection', async ({
        page,
      }: {
        page: Page;
      }) => {
        const map = new MapWrapper(page);

        await test.step('Open app and ensure map is ready', async () => {
          await map.goto();
          await map.waitForReady();
        });

        await test.step('Collect and attach sample admin geo data', async () => {
          const data = await page.evaluate(() => {
            /* Work with a small, defensive sample of the admin data exposed on window */
            const w = window as unknown as Window & { __DATA__?: unknown };
            const d = w.__DATA__ ?? {};

            const sample = (arr: unknown[]) =>
              Array.isArray(arr)
                ? arr.slice(0, 5).map((a: unknown) => {
                    const item = a as Record<string, unknown>;
                    const id = item['id'] ?? item['city_id'] ?? null;
                    const name = item['city_name'] ?? item['name'] ?? item['title'] ?? null;
                    const coordsRaw =
                      item['coords'] ??
                      item['geometry'] ??
                      (item['parsedGeom'] &&
                      (item['parsedGeom'] as { coordinates?: unknown }).coordinates
                        ? (item['parsedGeom'] as { coordinates?: unknown }).coordinates
                        : null);
                    let coords: null | [number, number] = null;
                    if (Array.isArray(coordsRaw)) {
                      const arr0 = coordsRaw as unknown[];
                      const firstCandidate =
                        Array.isArray(arr0[0]) && Array.isArray((arr0[0] as unknown[])[0])
                          ? (arr0[0] as unknown[])[0]
                          : (arr0[0] ?? arr0);
                      if (
                        Array.isArray(firstCandidate) &&
                        typeof (firstCandidate as unknown[])[0] === 'number' &&
                        typeof (firstCandidate as unknown[])[1] === 'number'
                      ) {
                        const f = firstCandidate as number[];
                        coords = [Number(f[0].toFixed(6)), Number(f[1].toFixed(6))];
                      } else if (typeof arr0[0] === 'number' && typeof arr0[1] === 'number') {
                        coords = [
                          Number((arr0[0] as number).toFixed(6)),
                          Number((arr0[1] as number).toFixed(6)),
                        ];
                      }
                    }
                    return { id, name, coords };
                  })
                : [];

            return {
              cities: {
                count: Array.isArray((d as Record<string, unknown>)['citiesWithCoords'])
                  ? ((d as Record<string, unknown>)['citiesWithCoords'] as unknown[]).length
                  : 0,
                sample: sample(
                  ((d as Record<string, unknown>)['citiesWithCoords'] as unknown[]) ?? [],
                ),
              },
              citiesPolygons: {
                count: Array.isArray((d as Record<string, unknown>)['citiesWithPolygonCoords'])
                  ? ((d as Record<string, unknown>)['citiesWithPolygonCoords'] as unknown[]).length
                  : 0,
                sample: sample(
                  ((d as Record<string, unknown>)['citiesWithPolygonCoords'] as unknown[]) ?? [],
                ),
              },
              countries: {
                count: Array.isArray((d as Record<string, unknown>)['countriesWithCoords'])
                  ? ((d as Record<string, unknown>)['countriesWithCoords'] as unknown[]).length
                  : 0,
                sample: sample(
                  ((d as Record<string, unknown>)['countriesWithCoords'] as unknown[]) ?? [],
                ),
              },
              regions: {
                count: Array.isArray((d as Record<string, unknown>)['regionsWithCoords'])
                  ? ((d as Record<string, unknown>)['regionsWithCoords'] as unknown[]).length
                  : 0,
                sample: sample(
                  ((d as Record<string, unknown>)['regionsWithCoords'] as unknown[]) ?? [],
                ),
              },
            };
          });

          test.info().attach('admin-geo-data.json', {
            body: JSON.stringify(data, null, 2),
            contentType: 'application/json',
          });
        });
      });
    });
  });
});
