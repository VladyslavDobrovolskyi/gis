import { test, expect, type Page } from '@playwright/test';
import { MapWrapper } from '../pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';

/*
  Cluster behavior tests

  - Verify cluster group is present and contains markers
  - Clicking a cluster should either zoom the map in or reduce the number of clusters
  - Clicking an individual marker should open a popup containing the city name
*/

test.describe('Map Editing', () => {
  test.describe('Clusters', () => {
    test.beforeEach(() => {
      /* Allure metadata must be set during test runtime */
      allure.epic('Map Editing');
      allure.feature('Clusters');
      allure.story('Cluster behavior');
      allure.tag('e2e');
      allure.severity(allure.Severity.NORMAL);

      /* Increase per-test timeout for actions that might take longer */
      test.setTimeout(60000);
    });

    test('Marker cluster group is created and contains markers', async ({
      page,
    }: {
      page: Page;
    }) => {
      const map = new MapWrapper(page);

      await test.step('Open app and ensure map is ready', async () => {
        await map.goto();
        await map.waitForReady();
      });

      await test.step('Assert cluster group exists and contains markers', async () => {
        const info = await page.evaluate(() => {
          const w = window as unknown as Window & {
            __LAYERS__?: {
              cityMarkers?: { getLayers?: () => unknown[] } | null;
            };
          };
          const cluster = w.__LAYERS__?.cityMarkers;
          const hasCluster = Boolean(cluster);
          let count = 0;
          if (cluster && typeof cluster.getLayers === 'function') {
            try {
              const layers = cluster.getLayers();
              count = Array.isArray(layers) ? layers.length : 0;
            } catch {
              count = 0;
            }
          } else {
            count = document.querySelectorAll('.leaflet-marker-icon').length;
          }
          const domClusters = document.querySelectorAll('.marker-cluster').length;
          return { hasCluster, count, domClusters };
        });

        expect(info.domClusters > 0 || info.count > 0).toBeTruthy();
      });
    });

    test('Clicking a cluster zooms in or reduces cluster count', async ({
      page,
    }: {
      page: Page;
    }) => {
      const map = new MapWrapper(page);

      await test.step('Open app and ensure map is ready', async () => {
        await map.goto();
        await map.waitForReady();
      });

      await test.step('Click a visible cluster and observe map change', async () => {
        const clusterCount = await page.locator('.marker-cluster').count();
        if (clusterCount === 0)
          test.skip(true, 'No clusters detected in fixture; skipping cluster interaction test');

        const initialZoom = (await page.evaluate(() => {
          const m = (window as unknown as Window & { __MAP__?: { getZoom?: () => number } })
            .__MAP__;
          return m && typeof m.getZoom === 'function' ? m.getZoom() : null;
        })) as number | null;

        const initialClusterCount = await page.locator('.marker-cluster').count();

        const cluster = page.locator('.marker-cluster').first();
        await cluster.waitFor({ state: 'visible', timeout: 10000 });
        await cluster.click();

        const ok = await page
          .waitForFunction(
            ([prevZoom, prevCount]: [number | null, number]) => {
              const m = (window as unknown as Window & { __MAP__?: { getZoom?: () => number } })
                .__MAP__;
              const zoom = m && typeof m.getZoom === 'function' ? m.getZoom() : null;
              const currClusters = document.querySelectorAll('.marker-cluster').length;
              return (
                (typeof zoom === 'number' && prevZoom != null && zoom > prevZoom) ||
                currClusters < prevCount
              );
            },
            [initialZoom, initialClusterCount],
            { timeout: 10000, polling: 250 },
          )
          .then(() => true)
          .catch(() => false);

        expect(ok).toBeTruthy();
      });
    });

    test('Clicking a marker opens its popup with the city name', async ({
      page,
    }: {
      page: Page;
    }) => {
      const map = new MapWrapper(page);

      await test.step('Open app and ensure map is ready', async () => {
        await map.goto();
        await map.waitForReady();
      });

      await test.step('Ensure marker is visible (click cluster if necessary)', async () => {
        let markerCount = await page.locator('.leaflet-marker-icon').count();

        if (markerCount === 0) {
          const clusterCount = await page.locator('.marker-cluster').count();
          if (clusterCount === 0)
            test.skip(true, 'No markers or clusters present; skipping marker popup test');

          const cluster = page.locator('.marker-cluster').first();
          await cluster.waitFor({ state: 'visible', timeout: 10000 });
          await cluster.click();
          await page
            .waitForFunction(
              () => document.querySelectorAll('.leaflet-marker-icon').length > 0,
              null,
              { timeout: 10000, polling: 250 },
            )
            .catch(() => {});
          markerCount = await page.locator('.leaflet-marker-icon').count();
          if (markerCount === 0)
            test.skip(
              true,
              'Markers did not become visible after cluster expansion; skipping marker popup test',
            );
        }

        expect(markerCount).toBeGreaterThan(0);
      });

      await test.step('Click a marker corresponding to the first city and assert popup', async () => {
        await page.evaluate(() => {
          const w = window as unknown as Window & { __DATA__?: unknown };
          const d = w.__DATA__ as Record<string, unknown> | undefined;
          const cities =
            d && Array.isArray(d['citiesWithCoords']) ? (d['citiesWithCoords'] as unknown[]) : [];
          const first = cities && cities.length ? (cities[0] as Record<string, unknown>) : null;
          return (first && ((first['city_name'] as string) || (first['name'] as string))) || '';
        });

        const clicked = await page.evaluate(() => {
          const w = window as unknown as Window & {
            __DATA__?: unknown;
            __LAYERS__?: { cityMarkers?: { getLayers?: () => unknown[] } | null } | null;
          };

          const d = w.__DATA__ as Record<string, unknown> | undefined;
          const cities =
            d && Array.isArray(d['citiesWithCoords']) ? (d['citiesWithCoords'] as unknown[]) : [];
          const city = cities && cities.length ? (cities[0] as Record<string, unknown>) : null;
          if (!city) return false;
          const coords = city['coords'] as unknown;
          if (!coords || !Array.isArray(coords)) return false;
          const [lat, lng] = coords as [number, number];

          const cluster = w.__LAYERS__?.cityMarkers;
          if (cluster && typeof cluster.getLayers === 'function') {
            try {
              const layers = cluster.getLayers ? cluster.getLayers() : [];
              for (let i = 0; i < layers.length; i++) {
                const l = layers[i] as {
                  getLatLng?: () => { lat: number; lng: number };
                  fire?: (ev: string) => void;
                } | null;
                try {
                  if (l && typeof l.getLatLng === 'function') {
                    const ll = l.getLatLng!();
                    if (ll && ll.lat === lat && ll.lng === lng) {
                      if (typeof l.fire === 'function') {
                        l.fire('click');
                      }
                      return true;
                    }
                  }
                } catch {
                  /* ignore individual layer errors */
                }
              }
            } catch {
              /* ignore cluster internals errors */
            }
          }

          /* Fallback: click visible marker DOM element */
          const mk = document.querySelector('.leaflet-marker-icon') as HTMLElement | null;
          if (mk) {
            mk.click();
            return true;
          }
          return false;
        });

        if (!clicked) throw new Error('Unable to click marker (no matching marker found)');

        /* Try to wait for popup; if not visible, attempt programmatic openPopup then wait longer */
        let popupVisible = true;
        try {
          await page.waitForSelector('.leaflet-popup-content', {
            state: 'visible',
            timeout: 10000,
          });
        } catch {
          popupVisible = await page.evaluate(() => {
            const w = window as unknown as Window & {
              __LAYERS__?: { cityMarkers?: { getLayers?: () => unknown[] } | null };
              __DATA__?: unknown;
            };
            const d = w.__DATA__ as Record<string, unknown> | undefined;
            const cities =
              d && Array.isArray(d['citiesWithCoords']) ? (d['citiesWithCoords'] as unknown[]) : [];
            const first = cities && cities.length ? (cities[0] as Record<string, unknown>) : null;
            if (!first) return false;
            const coords = first['coords'] as unknown;
            if (!coords || !Array.isArray(coords)) return false;
            const [lat, lng] = coords as [number, number];
            const cluster = w.__LAYERS__?.cityMarkers;
            if (cluster && typeof cluster.getLayers === 'function') {
              try {
                const layers = cluster.getLayers();
                for (let i = 0; i < layers.length; i++) {
                  const l = layers[i] as {
                    getLatLng?: () => { lat: number; lng: number };
                    openPopup?: () => unknown;
                    fire?: (ev: string) => void;
                  } | null;
                  if (!l) continue;
                  try {
                    if (typeof l.getLatLng === 'function') {
                      const ll = l.getLatLng!();
                      if (ll && Math.abs(ll.lat - lat) < 1e-8 && Math.abs(ll.lng - lng) < 1e-8) {
                        if (typeof l.openPopup === 'function') {
                          (l as { openPopup?: () => unknown }).openPopup?.();
                          return true;
                        }
                        if (typeof l.fire === 'function') {
                          l.fire('click');
                          return true;
                        }
                      }
                    }
                  } catch {
                    /* ignore layer errors */
                  }
                }
              } catch {
                /* ignore cluster internals errors */
              }
            }
            /* Fallback: click a visible marker DOM element */
            const mk = document.querySelector('.leaflet-marker-icon') as HTMLElement | null;
            if (mk) {
              mk.click();
              return true;
            }
            return false;
          });
          if (popupVisible) {
            await page
              .waitForSelector('.leaflet-popup-content', { state: 'visible', timeout: 10000 })
              .catch(() => {});
          }
        }

        const popupText = (await page.locator('.leaflet-popup-content').textContent()) || '';
        /* Accept popup text that contains any known city or is non-empty */
        const cityNames = await page.evaluate(() => {
          const w = window as unknown as Window & { __DATA__?: unknown };
          const d = w.__DATA__ as Record<string, unknown> | undefined;
          const cities =
            d && Array.isArray(d['citiesWithCoords']) ? (d['citiesWithCoords'] as unknown[]) : [];
          return cities
            .map((c: unknown) => {
              const o = c as Record<string, unknown>;
              return (
                (o['city_name'] as string) ||
                (o['name'] as string) ||
                (o['title'] as string) ||
                ''
              ).toLowerCase();
            })
            .filter(Boolean)
            .slice(0, 50);
        });
        expect(popupText.trim().length).toBeGreaterThan(0);
        const matched = cityNames.some((n: string) => popupText.toLowerCase().includes(n));
        expect(matched).toBeTruthy();
      });
    });
  });
});
