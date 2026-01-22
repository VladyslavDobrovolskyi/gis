import { ref, watch } from 'vue';
import L from 'leaflet';
import { useMapStore } from '@/stores/map.store';

function getMapStore() {
  try {
    return useMapStore();
  } catch {
    return null as null | ReturnType<typeof useMapStore>;
  }
}
import {
  computeLengthLatLngs,
  computeAreaLatLngs,
  formatDistance,
  formatArea,
} from '@/lib/measurements';
import type { PmLayer } from '@/types/leaflet.types';

function flattenLatLngs(input: unknown): L.LatLng[] {
  if (!input) return [];
  if (!Array.isArray(input)) return [];
  // if nested array like L.LatLng[][]
  if (input.length && Array.isArray(input[0])) {
    return ([] as L.LatLng[]).concat(...(input as L.LatLng[][]));
  }
  return input as L.LatLng[];
}

export const measurementMode = ref<'distance' | 'area' | null>(null);
export const measurementText = ref<string>('');

// initialize local measurement refs from store (if present)
const ms = getMapStore();
if (ms?.measurementMode) measurementMode.value = ms.measurementMode;
// Do NOT restore a previous measurement text on startup
measurementText.value = '';
if (ms) ms.measurementText = '';

// keep store in sync with reactive refs
watch(measurementMode, (v) => {
  const s = getMapStore();
  if (s) s.measurementMode = v;
});
watch(measurementText, (v) => {
  const s = getMapStore();
  if (s) s.measurementText = v;
});

let currentDrawPoints: L.LatLng[] = [];

export function updateMeasurementFromPoints(points: L.LatLng[]) {
  if (!measurementMode.value) return;
  if (measurementMode.value === 'distance') {
    const length = computeLengthLatLngs(points);
    measurementText.value = formatDistance(length);
  } else if (measurementMode.value === 'area') {
    const area = computeAreaLatLngs(points);
    measurementText.value = formatArea(area);
  }
}

export function onDrawVertex(e: { latlng?: L.LatLng } | undefined): void {
  if (!e || !e.latlng) return;
  currentDrawPoints.push(e.latlng);
  updateMeasurementFromPoints(currentDrawPoints);
}

export function onMouseMoveDuringDraw(e: L.LeafletMouseEvent): void {
  if (!currentDrawPoints.length) return;
  const preview = [...currentDrawPoints, e.latlng];
  updateMeasurementFromPoints(preview);
}

export function startDrawMode(map: L.Map | undefined, shape: string): void {
  currentDrawPoints = [];
  const s = (shape || '').toLowerCase();
  if (s.includes('line') || s.includes('polyline')) {
    measurementMode.value = 'distance';
  } else if (s.includes('polygon') || s.includes('rectangle') || s.includes('circle')) {
    measurementMode.value = 'area';
  } else {
    measurementMode.value = null;
  }
  if (measurementMode.value === 'distance') {
    measurementText.value = formatDistance(0);
  } else if (measurementMode.value === 'area') {
    measurementText.value = formatArea(0);
  } else {
    measurementText.value = '';
  }
  if (!measurementMode.value || !map) return;
  map.on('pm:drawvertex', onDrawVertex as (ev: unknown) => void);
  map.on('mousemove', onMouseMoveDuringDraw as (ev: L.LeafletMouseEvent) => void);
}

export function stopDrawMode(map: L.Map | undefined): void {
  if (map) {
    map.off('pm:drawvertex', onDrawVertex as (ev: unknown) => void);
    map.off('mousemove', onMouseMoveDuringDraw as (ev: L.LeafletMouseEvent) => void);
  }
  measurementMode.value = null;
  currentDrawPoints = [];
  setTimeout(() => (measurementText.value = ''), 3000);
}

export function attachEditListeners(layer: PmLayer): void {
  // support polygons, polylines and circles
  if (layer instanceof L.Circle) {
    measurementMode.value = 'area';
  } else {
    measurementMode.value =
      layer instanceof L.Polygon ? 'area' : layer instanceof L.Polyline ? 'distance' : null;
  }
  if (!measurementMode.value) return;

  const update = (): void => {
    try {
      if (layer instanceof L.Circle) {
        const r = (layer as L.Circle).getRadius(); // meters
        const area = Math.PI * r * r;
        measurementText.value = `${formatDistance(r)} • ${formatArea(area)}`;
        return;
      }
      if (typeof layer.getLatLngs === 'function') {
        const ll = layer.getLatLngs();
        // normalize a variety of getLatLngs return shapes (flat or nested arrays)
        const pts = flattenLatLngs(ll);
        updateMeasurementFromPoints(pts);
      }
    } catch {
      /* ignore */
    }
  };

  if (layer.on) layer.on('pm:edit', update);
  if (layer.on) layer.on('pm:dragend', update);
  if (layer.on) layer.on('pm:update', update);
  update();
}

export function detachEditListeners(layer: PmLayer) {
  if (!layer) return;
  if (layer.off) layer.off('pm:edit');
  if (layer.off) layer.off('pm:dragend');
  if (layer.off) layer.off('pm:update');
  measurementText.value = '';
}
