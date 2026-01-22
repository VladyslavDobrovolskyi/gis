import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as allure from 'allure-js-commons';

// Mock leaflet types used by composable
vi.mock('leaflet', () => {
  class LatLng {
    constructor(
      public lat: number,
      public lng: number,
    ) {}
  }
  class Polygon {}
  class Polyline {}
  class Circle {}
  const def = { LatLng, Polygon, Polyline, Circle };
  return { default: def, LatLng, Polygon, Polyline, Circle };
});

// Mock measurements functions for deterministic outputs
vi.mock('@/lib/measurements', () => ({
  computeLengthLatLngs: () => 123.4,
  computeAreaLatLngs: () => 4567.89,
  formatDistance: (m: number) => `${Math.round(m)} m`,
  formatArea: (m2: number) => `${Math.round(m2)} m²`,
}));

import {
  measurementMode,
  measurementText,
  startDrawMode,
  stopDrawMode,
  onDrawVertex,
  onMouseMoveDuringDraw,
  attachEditListeners,
  detachEditListeners,
} from '@/composables/useMeasurements';
import L from 'leaflet';

beforeEach(() => {
  // reset reactive refs
  measurementMode.value = null;
  measurementText.value = '';
  // Clear any existing handlers by stopping draw mode
  stopDrawMode(undefined as unknown as L.Map);
});

beforeEach(() => {
  allure.epic('Composables');
  allure.feature('Measurements');
});

/* ------------------------------------------------------------------
 * useMeasurements
 * ------------------------------------------------------------------ */

describe('useMeasurements: start/stop draw mode', () => {
  it('Enters distance mode for polyline and sets initial text', () => {
    startDrawMode(undefined, 'polyline');
    expect(measurementMode.value).toBe('distance');
    expect(measurementText.value).toBe('0 m');
  });

  it('Enters area mode for polygon and sets initial text', () => {
    startDrawMode(undefined, 'polygon');
    expect(measurementMode.value).toBe('area');
    expect(measurementText.value).toBe('0 m²');
  });

  it('Resets on unknown shape and stopDrawMode clears state', () => {
    startDrawMode(undefined, 'unknown');
    expect(measurementMode.value).toBeNull();
    expect(measurementText.value).toBe('');
    // ensure stop resets values and triggers clear after timeout
    const fakeMap = { on: () => {}, off: () => {} } as unknown as L.Map;
    startDrawMode(fakeMap, 'polyline');
    stopDrawMode(fakeMap);
    // measurementText clears after timeout; we won't assert the timeout here
  });
});

describe('useMeasurements: drawing events', () => {
  it('Updates measurement on vertex and mouse move for distance mode', () => {
    startDrawMode(undefined, 'polyline');
    // push a vertex
    const lat = new (L as unknown as { LatLng: new (lat: number, lng: number) => L.LatLng }).LatLng(
      1,
      2,
    );
    const ev: { latlng?: L.LatLng } = { latlng: lat };
    onDrawVertex(ev);
    // measurementText should reflect mocked computeLength -> 123.4 -> '123 m'
    expect(measurementText.value).toBe('123 m');

    // simulate mouse move during draw
    onMouseMoveDuringDraw({ latlng: { lat: 3, lng: 4 } } as unknown as L.LeafletMouseEvent);
    expect(measurementText.value).toBe('123 m');
  });

  it('Does not update when measurementMode is null', () => {
    measurementMode.value = null;
    measurementText.value = '';
    const lat = new (L as unknown as { LatLng: new (lat: number, lng: number) => L.LatLng }).LatLng(
      1,
      2,
    );
    const ev: { latlng?: L.LatLng } = { latlng: lat };
    onDrawVertex(ev);
    expect(measurementText.value).toBe('');
  });
});

describe('useMeasurements: attach/detach edit listeners', () => {
  it('Attaches listeners and updates on pm:edit for a polygon-like layer', () => {
    // create a fake layer with getLatLngs and on/off
    const listeners: Record<string, Array<() => void>> = {};
    // Create a plain object that satisfies PmLayer to avoid Leaflet's complex overloads
    const PolygonCtor = (L as unknown as { Polygon: new () => unknown }).Polygon;
    const polyInstance = new PolygonCtor();
    const poly = polyInstance as unknown as import('@/types/leaflet.types').PmLayer & {
      getLatLngs: () => unknown;
    };
    poly.getLatLngs = () => [[{ lat: 1, lng: 2 }]];
    (polyInstance as unknown as Record<string, unknown>).on = (
      ev: string,
      fn: (...args: unknown[]) => void,
    ) => {
      listeners[ev] = listeners[ev] || [];
      listeners[ev].push(() => fn());
    };
    (polyInstance as unknown as Record<string, unknown>).off = (
      ev?: string,
      _fn?: (...args: unknown[]) => void,
    ) => {
      void _fn;
      if (!ev) Object.keys(listeners).forEach((k) => delete listeners[k]);
      else delete listeners[ev];
    };

    attachEditListeners(poly);
    // update should have run once on attach, setting measurementText to area for polygons
    expect(measurementText.value).toBe('4568 m²');

    // simulate pm:edit
    (listeners['pm:edit'] || []).forEach((fn) => fn());
    expect(measurementText.value).toBe('4568 m²');

    // detach
    detachEditListeners(poly);
    expect(measurementText.value).toBe('');
  });

  it('Handles circle layers specially', () => {
    const CircleCtor = (L as unknown as { Circle: new () => unknown }).Circle;
    const circleInstance = new CircleCtor();
    const circle = circleInstance as unknown as import('@/types/leaflet.types').PmLayer & {
      getRadius: () => number;
    };
    circle.getRadius = () => 10;
    (circleInstance as unknown as Record<string, unknown>).on = (
      _ev: string,
      _fn: (...args: unknown[]) => void,
    ) => {
      void _ev;
      void _fn;
    };
    (circleInstance as unknown as Record<string, unknown>).off = (
      _ev?: string,
      _fn?: (...args: unknown[]) => void,
    ) => {
      void _ev;
      void _fn;
    };

    attachEditListeners(circle);
    // measurementText should reflect circle area formatting: `${formatDistance(r)} • ${formatArea(area)}`
    expect(measurementText.value).toContain('m');
  });
});
