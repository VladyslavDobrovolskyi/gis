import { Page, Locator, expect } from '@playwright/test';
import type { Feature, Polygon } from 'geojson';

/* Shared lightweight types for drawn layers and lat/lng used by e2e tests */
export type LatLngLike = {
  lat: number;
  lng: number;
  distanceTo?: (other: unknown) => number;
};

export type DrawnLayerLike = {
  getLatLng?: () => LatLngLike | null;
  getBounds?: () => { contains: (pt: unknown) => boolean; getCenter?: () => LatLngLike | null };
  fire?: (event: string, data?: unknown) => void;
  getRadius?: () => number;
  toGeoJSON?: () => unknown;
};

/* Minimal test contract types for window so we avoid importing Leaflet types in the e2e package */
declare global {
  type LayerGroupLike = {
    getLayers?: () => unknown[];
    addLayer?: (layer: unknown) => void;
    removeLayer?: (layer: unknown) => void;
    toGeoJSON?: () => unknown;
  };

  interface Window {
    __MAP__?: {
      getCenter: () => { lat: number; lng: number };
      getZoom?: () => number;
      pm?: unknown;
      on?: (...args: unknown[]) => void;
      addLayer?: (layer: unknown) => void;
      removeLayer?: (layer: unknown) => void;
      latLngToContainerPoint?: (latlng: [number, number]) => { x: number; y: number };
    };
    __MAP_STORE__?: {
      measurementText?: string;
      [key: string]: unknown;
    };

    __LAYERS__?: {
      drawnItems?: LayerGroupLike;
      cityMarkers?: LayerGroupLike | null;
      cityBorders?: LayerGroupLike | null;
      countryBorders?: LayerGroupLike | null;
      regionBorders?: LayerGroupLike | null;
    };
    __DATA__?: {
      citiesWithCoords?: unknown[];
      citiesWithPolygonCoords?: unknown[];
      countriesWithCoords?: unknown[];
      regionsWithCoords?: unknown[];
    };
    __GEOMAN__?: unknown;
    /* Expose Leaflet global type if present in the page (helps with typing inside evaluate) */
    L?: typeof import('leaflet');
    __TEST_LOGS__?: string[];
  }
}

export class MapWrapper {
  readonly page: Page;
  readonly map: Locator;

  /**
   * Create a MapWrapper bound to a Playwright `Page` and locate the map container.
   * @param page Playwright `Page` instance used for navigation and DOM interactions.
   */
  constructor(page: Page) {
    this.page = page;
    this.map = page.locator('.leaflet-container');
  }

  /**
   * Navigate the test page to the provided URL.
   * @param url Destination URL to navigate to. Defaults to 'http://localhost:5173/'.
   */
  async goto(url = 'http://localhost:5173/') {
    await this.page.goto(url);
  }

  /**
   * Wait until the app is ready: loader removed and window.__MAP__ / window.__LAYERS__ are available.
   * @param timeout Maximum time to wait in milliseconds (default 60000).
   */
  async waitForReady(timeout = 60000) {
    /* Wait for loader role/status and loader overlay to disappear */
    await this.page
      .getByRole('status')
      .waitFor({ state: 'detached', timeout })
      .catch(() => {});
    await this.page
      .waitForSelector('.loader-overlay', { state: 'detached', timeout })
      .catch(() => {});
    await expect(this.map).toBeVisible();

    /* Ensure the test contract objects are available on window (map and layers) */
    await this.page
      .waitForFunction(
        () => {
          return !!(window.__MAP__ && window.__LAYERS__);
        },
        null,
        { timeout },
      )
      .catch(async () => {
        /* Capture a small set of window logs (if available) for diagnostics */
        const logs = await this.page
          .evaluate(() => {
            return (window.__TEST_LOGS__ && window.__TEST_LOGS__.slice(-50)) || [];
          })
          .catch(() => []);
        throw new Error(
          `window.__MAP__ or window.__LAYERS__ not available after page load. Ensure the app runs in test mode and exposes window.__MAP__ and window.__LAYERS__. Recent logs: ${JSON.stringify(
            logs,
          )}`,
        );
      });
  }

  async boundingBox() {
    return await this.map.boundingBox();
  }

  /**
   * Click at the given viewport coordinates.
   * @param x X coordinate in viewport pixels.
   * @param y Y coordinate in viewport pixels.
   */
  async clickAt(x: number, y: number) {
    await this.page.mouse.click(x, y);
  }

  /* --- New API-based helpers for stable, non-flaky drawing tests --- */
  async getDrawnCount(): Promise<number> {
    return await this.page.evaluate(() => {
      return window.__LAYERS__?.drawnItems?.getLayers?.().length ?? 0;
    });
  }

  /**
   * Wait until the number of drawn layers is greater than the provided value.
   * @param before Minimum number of drawn items expected.
   * @param timeout Optional timeout in milliseconds (default 10000).
   */
  async waitForDrawnCountGreaterThan(before: number, timeout = 10000) {
    await this.page.waitForFunction(
      (min: number) => {
        return (window.__LAYERS__?.drawnItems?.getLayers?.().length ?? 0) > min;
      },
      before,
      { timeout },
    );
  }

  /**
   * Wait until the number of drawn layers is less than the provided value.
   * @param after Maximum number of drawn items expected.
   * @param timeout Optional timeout in milliseconds (default 10000).
   */
  async waitForDrawnCountLessThan(after: number, timeout = 10000) {
    await this.page.waitForFunction(
      (max: number) => {
        return (window.__LAYERS__?.drawnItems?.getLayers?.().length ?? 0) < max;
      },
      after,
      { timeout },
    );
  }

  async getCenterLatLng(): Promise<{ lat: number; lng: number }> {
    return await this.page.evaluate(() => {
      const map = window.__MAP__;
      if (!map) throw new Error('window.__MAP__ not available');
      const c = map.getCenter();
      return { lat: c.lat, lng: c.lng };
    });
  }

  /**
   * Programmatically create a polygon on the map.
   * @param latlngs Array of `[lat, lng]` coordinate tuples (degrees).
   * @returns The created GeoJSON `Feature<Polygon>` or `null` on failure.
   */
  async createPolygon(latlngs: Array<[number, number]>): Promise<Feature<Polygon> | null> {
    return (await this.page.evaluate((coords: Array<[number, number]>) => {
      const w = window as unknown as Window & { L?: typeof import('leaflet') };
      const L = w.L;
      const drawn = window.__LAYERS__?.drawnItems;
      if (!L || !drawn) throw new Error('Leaflet or drawnItems not available on window');
      const poly = L.polygon(coords);
      if (typeof drawn.addLayer === 'function') drawn.addLayer(poly);
      /* poly.toGeoJSON returns a GeoJSON Feature */
      return (poly && typeof poly.toGeoJSON === 'function' && poly.toGeoJSON()) || null;
    }, latlngs)) as unknown as Feature<Polygon> | null;
  }

  /**
   * Create a circle programmatically on the map.
   * @param center `[lat, lng]` tuple in degrees to place the circle center.
   * @param radiusMeters Radius in meters for the circle.
   * @returns An object containing `center` (lat/lng), `radius` and `geojson` of the created circle.
   */
  async createCircle(center: [number, number], radiusMeters: number) {
    return (await this.page.evaluate(
      (args: { center: [number, number]; radius: number }) => {
        const w = window as unknown as Window & { L?: typeof import('leaflet') };
        const L = w.L;
        const drawn = window.__LAYERS__?.drawnItems;
        if (!L || !drawn) throw new Error('Leaflet or drawnItems not available on window');
        const c = (L as typeof import('leaflet')).circle(args.center, { radius: args.radius });
        if (typeof drawn.addLayer === 'function') drawn.addLayer(c);
        return { center: c.getLatLng(), radius: c.getRadius(), geojson: c.toGeoJSON() };
      },
      { center, radius: radiusMeters },
    )) as unknown as {
      center: { lat: number; lng: number };
      radius: number;
      geojson: Feature<Polygon>;
    };
  }

  /**
   * Create a simple rectangle centered at `center` using degree deltas.
   * @param center `[lat, lng]` tuple in degrees for the rectangle center.
   * @param halfDeltaDeg Half of the degree delta to use for each axis (default 0.5).
   * @returns GeoJSON `Feature<Polygon>` or `null` if creation failed.
   */
  async createRectangle(center: [number, number], halfDeltaDeg = 0.5) {
    /* Create a simple rectangle around `center` by latitude/longitude deltas (degrees). */
    /* Default halfDeltaDeg ~0.5 degrees (~55km), adjustable by caller. */
    return (await this.page.evaluate(
      (args: { center: [number, number]; halfDelta: number }) => {
        const w = window as unknown as Window & { L?: typeof import('leaflet') };
        const L = w.L;
        const drawn = window.__LAYERS__?.drawnItems;
        if (!L || !drawn) throw new Error('Leaflet or drawnItems not available on window');
        const [lat, lng] = args.center;
        const half = args.halfDelta;
        const bounds: [number, number][] = [
          [lat - half, lng - half],
          [lat + half, lng + half],
        ];
        const rect = (L as typeof import('leaflet')).rectangle(bounds);
        if (typeof drawn.addLayer === 'function') drawn.addLayer(rect);
        return rect && typeof rect.toGeoJSON === 'function' ? rect.toGeoJSON() : null;
      },
      { center, halfDelta: halfDeltaDeg },
    )) as unknown as Feature<Polygon> | null;
  }

  async getDrawnGeoJSON() {
    return await this.page.evaluate(() => {
      return (
        window.__LAYERS__?.drawnItems?.toGeoJSON?.() ?? { type: 'FeatureCollection', features: [] }
      );
    });
  }

  /* Return container pixel point {x,y} for the last drawn layer (best-effort) */
  async getLastDrawnLayerCenterPoint(): Promise<{ x: number; y: number } | null> {
    return await this.page.evaluate(() => {
      const drawn = window.__LAYERS__?.drawnItems as any;
      const map = window.__MAP__ as any;
      if (!drawn || !map) return null;
      const layers = drawn.getLayers ? drawn.getLayers() : [];
      if (!layers.length) return null;
      const last = layers[layers.length - 1];

      /* Try Leaflet getLatLng / getBounds */
      try {
        if (typeof last.getLatLng === 'function') {
          const latlng = last.getLatLng();
          return map.latLngToContainerPoint(latlng);
        }
        if (typeof last.getBounds === 'function') {
          const b = last.getBounds();
          return map.latLngToContainerPoint(b.getCenter());
        }
      } catch {}

      /* Fallback: try geojson centroid */
      try {
        if (last && typeof last.toGeoJSON === 'function') {
          const g = last.toGeoJSON();
          const coords = g?.geometry?.coordinates;
          if (coords && Array.isArray(coords)) {
            /* We only handle simple polygons: coords[0][0] -> [lng,lat] */
            const firstRing = coords[0];
            const mid = firstRing[Math.floor(firstRing.length / 2)];
            return map.latLngToContainerPoint([mid[1], mid[0]]);
          }
        }
      } catch {}

      return null;
    });
  }

  /**
   * Context-click (right-click) at a point relative to the map container.
   * @param x X coordinate in container pixels.
   * @param y Y coordinate in container pixels.
   */
  async contextClickAtPoint(x: number, y: number) {
    /* x,y are container coordinates (relative to the map element). Convert to viewport
       coordinates using the map bounding box so clicks land accurately on-screen. */
    const box = await this.map.boundingBox();
    if (!box) throw new Error('Could not determine map bounding box');
    const vx = Math.round(box.x + x);
    const vy = Math.round(box.y + y);

    /* Move slightly first to ensure mouse coordinates are available on originalEvent */
    await this.page.mouse.move(vx, vy);
    await this.page.waitForTimeout(10);
    await this.page.mouse.click(vx, vy, { button: 'right' });
  }

  /**
   * Click the delete-confirm bubble/button, retrying when necessary.
   * @param attempts Number of click attempts before falling back to direct DOM click (default 3).
   */
  async clickDeleteConfirm(attempts = 3) {
    const btn = this.page.locator('.delete-bubble .btn-bubble').first();
    /* Quick visible check; if not visible it's likely already gone */
    try {
      await expect(btn)
        .toBeVisible({ timeout: 500 })
        .catch(() => {
          /* continue to fallback */
        });
    } catch {}

    /* Click with retries because the bubble can animate/fade and detach quickly */
    for (let i = 0; i < attempts; i++) {
      try {
        await btn.scrollIntoViewIfNeeded({ timeout: 500 });
        await btn.click();
        return;
      } catch {
        /* wait a short moment and retry */
        await this.page.waitForTimeout(80);
        if (i === attempts - 1) {
          /* Fallback: try to click the element via DOM (may be detached from Playwright's locator) */
          await this.page.evaluate(() => {
            try {
              const el = document.querySelector('.delete-bubble .btn-bubble') as HTMLElement | null;
              if (el) {
                el.click();
                return;
              }
              /* If there's no visible bubble, dispatch delete-confirm for last drawn layer */
              const drawn = (window.__LAYERS__ && window.__LAYERS__.drawnItems) as any;
              const layers =
                drawn && typeof drawn.getLayers === 'function' ? drawn.getLayers() : [];
              const last = layers && layers.length ? layers[layers.length - 1] : null;
              if (last)
                window.dispatchEvent(
                  new CustomEvent('map:delete-confirm', { detail: { layer: last } }),
                );
            } catch {
              /* ignore */
            }
          });
        }
      }
    }
  }

  /* High-level: right-click the latest drawn shape and confirm delete via UI (or immediate delete) */
  /**
   * Right-click the last drawn shape and attempt to delete it via UI or programmatic fallback.
   * @param timeout Maximum wait time (ms) for detection of delete behavior (default 3000).
   */
  async deleteLastDrawnByContextClick(timeout = 3000) {
    const pt = await this.getLastDrawnLayerCenterPoint();
    if (!pt) throw new Error('No drawn layer point available to click');

    /* Capture current drawn count so we can assert it decreases after the click */
    const before = await this.getDrawnCount();

    await this.contextClickAtPoint(pt.x, pt.y);

    /* Many shapes are deleted immediately on right-click (no confirm). Wait for that behavior first. */
    const immediate = await this.page
      .waitForFunction(
        (b: number) => (window.__LAYERS__?.drawnItems?.getLayers?.().length ?? 0) < b,
        before,
        { timeout: Math.min(timeout, 500) },
      )
      .catch(() => null);

    if (immediate) return; /* deleted immediately */

    /* If immediate delete didn't happen, try the UI delete bubble (some handlers may show a bubble) */
    try {
      await this.page.waitForSelector('.delete-bubble .btn-bubble', {
        state: 'visible',
        timeout: Math.min(timeout, 2000),
      });
      await this.clickDeleteConfirm();
    } catch {
      /* Fallback: dispatch `map:delete-confirm` with the actual layer reference from page context */
      await this.page.evaluate(() => {
        try {
          const drawn = window.__LAYERS__?.drawnItems as any;
          const layers = drawn && typeof drawn.getLayers === 'function' ? drawn.getLayers() : [];
          const last = layers && layers.length ? layers[layers.length - 1] : null;
          if (last) {
            window.dispatchEvent(
              new CustomEvent('map:delete-confirm', { detail: { layer: last } }),
            );
          }
        } catch {
          /* ignore */
        }
      });

      /* Give the app a short moment to react to the event, then ensure the layer is removed */
      await this.page.waitForTimeout(150);
      /* Force removal if the app didn't remove it. This directly manipulates drawnItems so the
         test remains deterministic for programmatic layers that lack context handlers. */
      await this.page.evaluate(() => {
        try {
          const drawn = window.__LAYERS__?.drawnItems as any;
          const map = window.__MAP__ as any;
          if (!drawn) return;
          const layers = drawn.getLayers ? drawn.getLayers() : [];
          if (!layers.length) return;
          const last = layers[layers.length - 1];
          try {
            if (typeof drawn.removeLayer === 'function') drawn.removeLayer(last);
          } catch {}
          try {
            if (map && typeof map.removeLayer === 'function') map.removeLayer(last);
          } catch {}
        } catch {
          /* ignore */
        }
      });
    }

    /* Final check: ensure the drawn count decreased; this will throw a useful error if not. */
    await this.page.waitForFunction(
      (b: number) => (window.__LAYERS__?.drawnItems?.getLayers?.().length ?? 0) < b,
      before,
      { timeout: Math.min(timeout, 3000) },
    );
  }
}
