import { describe, it, expect, beforeAll } from 'vitest';
import * as allure from 'allure-js-commons';
import { getPolygonCoordsFromGeoJSON, getPointCoordsFromGeoJSON } from '@/composables/useGeo';
import type { GeoPoint, GeoPolygon } from '@/composables/useGeo';

beforeAll(() => {
  allure.epic('Composables');
});

/* ------------------------------------------------------------------
 * useGeo
 * ------------------------------------------------------------------ */

describe('Composables: useGeo', () => {
  it('getPointCoordsFromGeoJSON returns [lat,lng] or null', () => {
    allure.feature('useGeo');
    allure.severity('Normal');

    const p: GeoPoint = { type: 'Point', coordinates: [30, 50] as [number, number] };
    expect(getPointCoordsFromGeoJSON(p)).toEqual([50, 30]);
    expect(getPointCoordsFromGeoJSON(null)).toBeNull();
  });

  it('getPolygonCoordsFromGeoJSON flips coords and handles Polygon & MultiPolygon', () => {
    allure.feature('useGeo');
    allure.severity('Normal');

    const poly: GeoPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [30, 50],
          [31, 51],
          [30, 50],
        ],
      ],
    };
    const res = getPolygonCoordsFromGeoJSON(poly);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0][0]).toEqual([50, 30]);

    const multi: GeoPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [30, 50],
            [31, 51],
            [30, 50],
          ],
        ],
      ],
    };
    const r2 = getPolygonCoordsFromGeoJSON(multi);
    expect(r2[0][0]).toEqual([50, 30]);
  });
});
