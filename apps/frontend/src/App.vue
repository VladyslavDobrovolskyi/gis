<template>
  <l-map ref="mapRef" :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap contributors"
    />

    <!-- Countries -->
    <l-polygon
      v-for="country in countriesWithCoords"
      :key="'country-' + country.ogc_fid"
      :lat-lngs="country.coords"
      color="green"
      :fill-opacity="0.15"
    />

    <!-- Regions -->
    <l-polygon
      v-for="region in regionsWithCoords"
      :key="'region-' + region.ogc_fid"
      :lat-lngs="region.coords"
      color="orange"
      :fill-opacity="0.18"
    />

    <!-- City polygons -->
    <l-polygon
      v-for="(city, idx) in citiesWithPolygonCoords"
      :key="'city-' + (city.ogc_fid ?? idx)"
      :lat-lngs="city.geometry"
      color="blue"
      :fill-opacity="0.25"
    />
    <div v-if="measurementText" class="measurement-badge">{{ measurementText }}</div>

    <!-- Small inline delete bubble (appears over a drawn element) -->
    <div
      v-if="deleteBubble.visible"
      class="delete-bubble"
      :style="{ left: deleteBubble.x + 'px', top: deleteBubble.y + 'px' }"
      @click.stop
      role="dialog"
      aria-label="Удалить объект"
    >
      <button class="btn-bubble" @click="confirmDeletion" aria-label="Удалить">✖</button>
    </div>
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue';
import { LMap, LTileLayer, LPolygon } from '@vue-leaflet/vue-leaflet';
import { trpc } from './trpc';
import type { City } from '@gis/shared/schemas';
import L, { Polyline, Polygon, LeafletEvent } from 'leaflet';
import { useQuery } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import { length as turfLength, area as turfArea, lineString, polygon } from '@turf/turf';
import { useMapStore } from './stores/map';

/* -------------------- Leaflet плагины -------------------- */

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

/* -------------------- Types -------------------- */

type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

type GeoPolygon =
  | {
      type: 'Polygon';
      coordinates: [number, number][][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: [number, number][][][];
    };

interface Country {
  ogc_fid: number;
  name: string;
  iso_code: string;
  geom: string | null;
}

interface Region {
  ogc_fid: number;
  name: string;
  iso_code: string;
  geom: string | null;
}

// minimal typing to avoid `any`
interface MarkerClusterGroupLike extends L.Layer {
  addLayer(layer: L.Layer): void;
  removeLayer(layer: L.Layer): void;
}
interface DrawnLayer extends L.Layer {
  // stable id assigned to user-created / restored layers
  drawnId?: string;
  getLatLngs?: () => unknown;
}

// typed wrapper for PM-enabled layers to avoid using `any`
interface PMAttachable {
  pm?: {
    enable?: () => void;
    disable?: () => void;
  };
}
interface GeomanPM {
  setLang?(lang: string): void;
  addControls?(opts: {
    position?: string;
    drawMarker?: boolean;
    drawCircleMarker?: boolean;
    drawPolyline?: boolean;
    drawPolygon?: boolean;
    drawRectangle?: boolean;
    editMode?: boolean;
    dragMode?: boolean;
    removalMode?: boolean;
  }): void;
  disableDraw?(): void;
  disableGlobalEditMode?(): void;
}

// Type guard for Geoman
function isGeoman(pm: unknown): pm is GeomanPM {
  return (
    !!pm &&
    typeof pm === 'object' &&
    ('setLang' in pm || 'addControls' in pm || 'disableDraw' in pm)
  );
}

// Factory for markerClusterGroup
function createMarkerClusterGroup(): MarkerClusterGroupLike | null {
  const maybeFactory = (L as unknown as Record<string, unknown>)['markerClusterGroup'];
  if (typeof maybeFactory === 'function') {
    return (maybeFactory as () => MarkerClusterGroupLike)();
  }
  const maybeCtor = (L as unknown as Record<string, unknown>)['MarkerClusterGroup'];
  if (typeof maybeCtor === 'function') {
    return new (maybeCtor as new () => MarkerClusterGroupLike)();
  }
  return null;
}

/* -------------------- Constants -------------------- */

const greenIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const mapRef = ref<InstanceType<typeof LMap> | null>(null);
let markerClusterGroup: MarkerClusterGroupLike | null = null;

/* -------------------- Queries -------------------- */

const { data: citiesData } = useQuery<City[]>({
  queryKey: ['cities'],
  queryFn: () => trpc.cities.getCities.query(),
});

const { data: countriesData } = useQuery<Country[]>({
  queryKey: ['countries'],
  queryFn: () => trpc.countries.getCountries.query(),
});

const { data: regionsData } = useQuery<Region[]>({
  queryKey: ['regions'],
  queryFn: () => trpc.regions.getRegions.query(),
});

/* -------------------- Parsing -------------------- */

const cities = computed(() =>
  (citiesData.value ?? []).map((c) => ({
    ...c,
    parsedGeom: c.geom ? (JSON.parse(c.geom) as GeoPoint | GeoPolygon) : null,
  })),
);

const countries = computed(() =>
  (countriesData.value ?? []).map((c) => ({
    ...c,
    parsedGeom: c.geom ? (JSON.parse(c.geom) as GeoPolygon) : null,
  })),
);

const regions = computed(() =>
  (regionsData.value ?? []).map((r) => ({
    ...r,
    parsedGeom: r.geom ? (JSON.parse(r.geom) as GeoPolygon) : null,
  })),
);

/* -------------------- Geo helpers (FIX) -------------------- */

/**
 * Всегда возвращает массив рингов:
 * [ [ [lat, lng], ... ] ]
 */
function getPolygonCoordsFromGeoJSON(geo: GeoPolygon | null): [number, number][][] {
  if (!geo) return [];

  const rings = geo.type === 'Polygon' ? geo.coordinates : geo.coordinates.flat();

  return rings.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
}

function getPointCoordsFromGeoJSON(geo: GeoPoint | null): [number, number] | null {
  if (!geo) return null;
  return [geo.coordinates[1], geo.coordinates[0]];
}

/* -------------------- Computed -------------------- */

const countriesWithCoords = computed(() =>
  countries.value
    .map((c) => ({
      ...c,
      coords: getPolygonCoordsFromGeoJSON(c.parsedGeom)[0] || [],
    }))
    .filter((c) => c.coords.length > 0),
);

const regionsWithCoords = computed(() =>
  regions.value
    .map((r) => ({
      ...r,
      coords: getPolygonCoordsFromGeoJSON(r.parsedGeom)[0] || [],
    }))
    .filter((r) => r.coords.length > 0),
);

const citiesWithCoords = computed(
  () =>
    cities.value
      .map((city) => ({
        ...city,
        coords:
          city.parsedGeom?.type === 'Point' ? getPointCoordsFromGeoJSON(city.parsedGeom) : null,
      }))
      .filter((city) => city.coords !== null) as (City & {
      coords: [number, number];
    })[],
);

const citiesWithPolygonCoords = computed(() =>
  cities.value
    .map((city) => ({
      ...city,
      geometry:
        city.parsedGeom?.type === 'Polygon' || city.parsedGeom?.type === 'MultiPolygon'
          ? getPolygonCoordsFromGeoJSON(city.parsedGeom)[0] || [][0] || []
          : [],
    }))
    .filter((city) => city.geometry.length > 0),
);

/* -------------------- Measurement helpers -------------------- */

let currentDrawPoints: L.LatLng[] = [];
const measurementMode = ref<'distance' | 'area' | null>(null);
const measurementText = ref<string>('');
// Pinia store persisted in localStorage via VueUse
const mapStore = useMapStore();

// initialize local measurement refs from store (if present)
if (mapStore.measurementMode) measurementMode.value = mapStore.measurementMode;
if (mapStore.measurementText) measurementText.value = mapStore.measurementText;

// keep store in sync with reactive refs
watch(measurementMode, (v) => (mapStore.measurementMode = v));
watch(measurementText, (v) => (mapStore.measurementText = v));

type PmLayer = L.Layer & {
  getLatLngs?: () => unknown;
  on?: (evt: string, fn: (...args: unknown[]) => void) => void;
  off?: (evt: string, fn?: (...args: unknown[]) => void) => void;
};

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}
function formatArea(m2: number): string {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`;
  return `${Math.round(m2)} m²`;
}

function computeLengthLatLngs(points: L.LatLng[]): number {
  if (points.length < 2) return 0;
  // turf expects [lng, lat]
  const coords = points.map((p) => [p.lng, p.lat] as [number, number]);
  const line = lineString(coords);
  // ask turf for meters directly
  return turfLength(line, { units: 'meters' }) as number;
}

function computeAreaLatLngs(points: L.LatLng[]): number {
  if (points.length < 3) return 0;
  // turf expects [lng, lat] and a closed linear ring
  const coords = points.map((p) => [p.lng, p.lat] as [number, number]);
  if (
    coords.length &&
    (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push(coords[0]);
  }
  const poly = polygon([coords]);
  // turf.area returns square meters
  return turfArea(poly) as number;
}

function updateMeasurementFromPoints(points: L.LatLng[]) {
  if (!measurementMode.value) return;
  if (measurementMode.value === 'distance') {
    const length = computeLengthLatLngs(points);
    measurementText.value = formatDistance(length);
  } else if (measurementMode.value === 'area') {
    const area = computeAreaLatLngs(points);
    measurementText.value = formatArea(area);
  }
}

function onDrawVertex(e: { latlng?: L.LatLng }): void {
  if (!e || !e.latlng) return;
  currentDrawPoints.push(e.latlng);
  updateMeasurementFromPoints(currentDrawPoints);
}

function onMouseMoveDuringDraw(e: L.LeafletMouseEvent): void {
  if (!currentDrawPoints.length) return;
  const preview = [...currentDrawPoints, e.latlng];
  updateMeasurementFromPoints(preview);
}

function startDrawMode(shape: string): void {
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
  const map = mapRef.value?.leafletObject as L.Map | undefined;
  if (!measurementMode.value || !map) return;
  map.on('pm:drawvertex', onDrawVertex as (ev: unknown) => void);
  map.on('mousemove', onMouseMoveDuringDraw as (ev: L.LeafletMouseEvent) => void);
}

function stopDrawMode(): void {
  const map = mapRef.value?.leafletObject as L.Map | undefined;
  if (map) {
    map.off('pm:drawvertex', onDrawVertex as (ev: unknown) => void);
    map.off('mousemove', onMouseMoveDuringDraw as (ev: L.LeafletMouseEvent) => void);
  }
  measurementMode.value = null;
  currentDrawPoints = [];
  setTimeout(() => (measurementText.value = ''), 3000);
}

function attachEditListeners(layer: PmLayer): void {
  measurementMode.value =
    layer instanceof L.Polygon ? 'area' : layer instanceof L.Polyline ? 'distance' : null;
  if (!measurementMode.value) return;
  const update = (): void => {
    if (typeof layer.getLatLngs === 'function') {
      const ll = layer.getLatLngs() as unknown;
      const pts: L.LatLng[] = ([] as L.LatLng[]).concat(...(ll as unknown as L.LatLng[][]));
      updateMeasurementFromPoints(pts);
    }
  };
  if (layer.on) layer.on('pm:edit', update);
  if (layer.on) layer.on('pm:dragend', update);
  if (layer.on) layer.on('pm:update', update);
  update();
}

function detachEditListeners(layer: PmLayer) {
  if (!layer) return;
  if (layer.off) layer.off('pm:edit');
  if (layer.off) layer.off('pm:dragend');
  if (layer.off) layer.off('pm:update');
  measurementText.value = '';
}

// typed helper for layers that expose `eachLayer`
interface LayerWithEach {
  eachLayer?: (fn: (l: L.Layer) => void) => void;
}

// Delete bubble state (appears over a drawn element) ✅
const deleteBubble = ref<{
  visible: boolean;
  x: number;
  y: number;
  layer: L.Layer | null;
  isGroup: boolean;
}>({ visible: false, x: 0, y: 0, layer: null, isGroup: false });

let bubbleClickAwayHandler: ((e: MouseEvent) => void) | null = null;
let bubbleEscHandler: ((e: KeyboardEvent) => void) | null = null;

function showDeleteBubble(target: L.Layer, isGroup = false, ev?: L.LeafletMouseEvent): void {
  const map = mapRef.value?.leafletObject as L.Map | undefined;
  let point: L.Point | null = null;
  if (ev && 'containerPoint' in ev && ev.containerPoint) {
    point = ev.containerPoint;
  } else if (ev && ev.latlng && map) {
    point = map.latLngToContainerPoint(ev.latlng);
  } else if (
    map &&
    (target as LayerWithEach & { getBounds?: () => L.LatLngBounds })?.getBounds &&
    typeof (target as LayerWithEach & { getBounds?: () => L.LatLngBounds }).getBounds === 'function'
  ) {
    try {
      const lw = target as LayerWithEach & { getBounds?: () => L.LatLngBounds };
      const center = lw.getBounds!().getCenter();
      point = map.latLngToContainerPoint(center);
    } catch {
      /* ignore */
    }
  }

  deleteBubble.value.layer = target;
  deleteBubble.value.isGroup = isGroup;
  deleteBubble.value.x = Math.max(8, Math.round(point ? point.x : 0));
  deleteBubble.value.y = Math.max(8, Math.round(point ? point.y : 0));
  deleteBubble.value.visible = true;
  try {
    console.debug('showDeleteBubble', {
      x: deleteBubble.value.x,
      y: deleteBubble.value.y,
      isGroup,
      target,
    });
  } catch {}
  try {
    bubbleClickAwayHandler = (e: MouseEvent) => {
      // click outside bubble closes it
      const el = document.querySelector('.delete-bubble');
      if (el && e.target && el.contains(e.target as Node)) return;
      cancelDeleteBubble();
    };
    bubbleEscHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDeleteBubble();
    };
    document.addEventListener('click', bubbleClickAwayHandler);
    document.addEventListener('keydown', bubbleEscHandler);
  } catch {
    /* ignore */
  }
}

function cancelDeleteBubble(): void {
  deleteBubble.value.visible = false;
  deleteBubble.value.layer = null;
  deleteBubble.value.isGroup = false;
  try {
    if (bubbleClickAwayHandler) document.removeEventListener('click', bubbleClickAwayHandler);
    if (bubbleEscHandler) document.removeEventListener('keydown', bubbleEscHandler);
  } catch {
    /* ignore */
  }
  bubbleClickAwayHandler = null;
  bubbleEscHandler = null;
}

function confirmDeletion(): void {
  const map = mapRef.value?.leafletObject as L.Map | undefined;
  const target = deleteBubble.value.layer;
  if (!map || !target) {
    cancelDeleteBubble();
    return;
  }
  try {
    if (deleteBubble.value.isGroup && typeof (target as LayerWithEach).eachLayer === 'function') {
      try {
        (target as LayerWithEach).eachLayer!((sub: L.Layer) => {
          try {
            if (map.hasLayer(sub)) map.removeLayer(sub);
          } catch {
            /* ignore */
          }
        });
      } catch {
        /* ignore */
      }
    } else {
      try {
        const t = target as L.Layer;
        if (map.hasLayer(t)) map.removeLayer(t);
      } catch {
        /* ignore */
      }
    }
    persistAllDrawnLayers(map);
  } catch {
    /* ignore */
  }
  cancelDeleteBubble();
}

/* -------------------- Map init -------------------- */

// small helper to generate stable unique ids for drawn features
function generateDrawnId(): string {
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === 'function') {
    try {
      return g.crypto.randomUUID!();
    } catch {
      // fallback
    }
  }
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`;
}

// collect and persist GeoJSON features currently on the map
function persistAllDrawnLayers(map: L.Map): void {
  const features: GeoJSON.Feature[] = [];
  map.eachLayer((layer: L.Layer) => {
    try {
      // Persist layers that are not explicitly ignored by Geoman (pmIgnore)
      const maybeDrawn = layer as DrawnLayer;
      const opts = (layer as unknown as { options?: Record<string, unknown> }).options || {};
      const pmIgnored = Boolean(opts.pmIgnore);
      if (
        !pmIgnored &&
        typeof (layer as L.Layer & { toGeoJSON?: unknown }).toGeoJSON === 'function'
      ) {
        const geo = (layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature }).toGeoJSON();
        if (
          geo &&
          (geo.geometry?.type === 'Polygon' ||
            geo.geometry?.type === 'MultiPolygon' ||
            geo.geometry?.type === 'LineString' ||
            geo.geometry?.type === 'MultiLineString')
        ) {
          // ensure feature id and a stable property
          const id = (maybeDrawn.drawnId ||= generateDrawnId());
          if (!geo.id) geo.id = id;
          if (!geo.properties) geo.properties = {} as Record<string, unknown>;
          (geo.properties as Record<string, unknown>).__id = id;
          features.push(geo);
        }
      }
    } catch {
      // ignore layers that fail conversion
    }
  });
  // ensure plain-serializable object and write directly to localStorage
  const fc = JSON.parse(
    JSON.stringify({ type: 'FeatureCollection', features }),
  ) as GeoJSON.FeatureCollection;
  try {
    localStorage.setItem('map:drawn', JSON.stringify(fc));
  } catch {
    // ignore localStorage errors (e.g., quota)
  }
  mapStore.drawn = fc;
}

const initMap = useDebounceFn(async (): Promise<void> => {
  await nextTick();
  const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
  if (!leafletMap) return;

  const pm = (leafletMap as unknown as { pm?: unknown }).pm;

  // restore saved view if present
  if (mapStore.center && mapStore.zoom) {
    try {
      leafletMap.setView(mapStore.center as [number, number], mapStore.zoom);
    } catch {
      /* ignore invalid stored view */
    }
  }

  // small helper to generate stable unique ids for drawn features
  function generateDrawnId(): string {
    const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
    if (g && g.crypto && typeof g.crypto.randomUUID === 'function') {
      try {
        return g.crypto.randomUUID!();
      } catch {
        // fallback
      }
    }
    return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`;
  }

  // collect and persist GeoJSON features currently on the map
  function persistAllDrawnLayers(map: L.Map): void {
    const features: GeoJSON.Feature[] = [];
    map.eachLayer((layer: L.Layer) => {
      try {
        // Persist layers that are not explicitly ignored by Geoman (pmIgnore)
        const maybeDrawn = layer as DrawnLayer;
        const opts = (layer as unknown as { options?: Record<string, unknown> }).options || {};
        const pmIgnored = Boolean(opts.pmIgnore);
        if (
          !pmIgnored &&
          typeof (layer as L.Layer & { toGeoJSON?: unknown }).toGeoJSON === 'function'
        ) {
          const geo = (layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature }).toGeoJSON();
          if (
            geo &&
            (geo.geometry?.type === 'Polygon' ||
              geo.geometry?.type === 'MultiPolygon' ||
              geo.geometry?.type === 'LineString' ||
              geo.geometry?.type === 'MultiLineString')
          ) {
            // ensure feature id and a stable property
            const id = (maybeDrawn.drawnId ||= generateDrawnId());
            if (!geo.id) geo.id = id;
            if (!geo.properties) geo.properties = {} as Record<string, unknown>;
            (geo.properties as Record<string, unknown>).__id = id;
            features.push(geo);
          }
        }
      } catch {
        // ignore layers that fail conversion
      }
    });
    // ensure plain-serializable object and write directly to localStorage
    const fc = JSON.parse(
      JSON.stringify({ type: 'FeatureCollection', features }),
    ) as GeoJSON.FeatureCollection;
    try {
      localStorage.setItem('map:drawn', JSON.stringify(fc));
    } catch {
      // ignore localStorage errors (e.g., quota)
    }
    mapStore.drawn = fc;
  }

  // Attach right-click-to-delete handler to a layer or its sublayers

  // Attach right-click-to-delete handler to a layer or its sublayers
  function attachContextDelete(layer: L.Layer | null | undefined): void {
    if (!layer) return;
    const maybe = layer as L.Layer & {
      on?: (evName: string, handler: (ev?: L.LeafletEvent) => void) => void;
      off?: (evName: string, handler?: (ev?: L.LeafletEvent) => void) => void;
      eachLayer?: (fn: (l: L.Layer) => void) => void;
      options?: Record<string, unknown>;
      // marker to avoid double-attaching
      __contextDeleteAttached?: boolean;
    };

    if (maybe.__contextDeleteAttached) return;
    maybe.__contextDeleteAttached = true;

    const handler = (ev?: L.LeafletMouseEvent) => {
      try {
        // determine clicked layer (ev.target if available), otherwise fallback to maybe
        const clickedLayer = ev?.target as L.Layer | undefined;
        const targetLayer = clickedLayer ?? maybe;

        // ensure we only delete user-created layers (they have drawnId)
        const tl = targetLayer as LayerWithEach & DrawnLayer;
        const isGroupLocal = typeof (tl as LayerWithEach).eachLayer === 'function';
        const isUserLayer =
          Boolean((tl as DrawnLayer).drawnId) ||
          (isGroupLocal &&
            (() => {
              let found = false;
              try {
                (tl as LayerWithEach).eachLayer!((sub: L.Layer) => {
                  if ((sub as DrawnLayer).drawnId) found = true;
                });
              } catch {
                /* ignore */
              }
              return found;
            })());
        if (!isUserLayer) return;

        // prevent default browser menu
        ev?.originalEvent?.preventDefault?.();
        ev?.originalEvent?.stopPropagation?.();

        // debug: report that the contextmenu handler fired
        try {
          console.debug('attachContextDelete:contextmenu', {
            isGroup: isGroupLocal,
            layer: tl,
            ev,
          });
        } catch {}

        // show small delete bubble above the element
        showDeleteBubble(tl as L.Layer, isGroupLocal, ev);
      } catch (err) {
        console.warn('attachContextDelete handler failed', err);
      }
    };

    if (maybe.on) {
      try {
        maybe.on('contextmenu', handler);
      } catch {
        // ignore
      }
    }

    // also attach to sublayers for groups
    if (typeof maybe.eachLayer === 'function') {
      try {
        maybe.eachLayer!((sub: L.Layer) => {
          const s = sub as L.Layer & {
            __contextDeleteAttached?: boolean;
            on?: (ev: string, handler: (ev?: L.LeafletEvent) => void) => void;
          };
          if (s.__contextDeleteAttached) return;
          s.__contextDeleteAttached = true;
          if (s.on) s.on('contextmenu', handler);
        });
      } catch {
        /* ignore */
      }
    }
  }

  // restore drawn features from store
  if (mapStore.drawn?.features?.length) {
    L.geoJSON(mapStore.drawn, {
      onEachFeature(_feature, layer: L.Layer) {
        try {
          layer.addTo(leafletMap);
          const idFromFeature = (_feature &&
            (_feature.id ||
              (_feature.properties && (_feature.properties as Record<string, unknown>).__id))) as
            | string
            | undefined;
          if (
            'eachLayer' in layer &&
            typeof (layer as L.Layer & { eachLayer?: (fn: (l: L.Layer) => void) => void })
              .eachLayer === 'function'
          ) {
            (layer as L.Layer & { eachLayer?: (fn: (l: L.Layer) => void) => void }).eachLayer!(
              (sub: L.Layer) => {
                const s = sub as DrawnLayer & PMAttachable & { options?: Record<string, unknown> };
                s.drawnId = idFromFeature ?? s.drawnId ?? generateDrawnId();
                s.options = s.options || {};
                (s.options as Record<string, unknown>).pmIgnore = false;
                if (s.pm && typeof s.pm.enable === 'function') {
                  try {
                    s.pm.enable();
                  } catch {
                    /* ignore */
                  }
                }
                // attach right-click-to-delete handler to restored sublayer
                attachContextDelete(sub);
              },
            );
          } else {
            const drawnLayer = layer as DrawnLayer &
              PMAttachable & { options?: Record<string, unknown> };
            drawnLayer.drawnId = idFromFeature ?? drawnLayer.drawnId ?? generateDrawnId();
            drawnLayer.options = drawnLayer.options || {};
            (drawnLayer.options as Record<string, unknown>).pmIgnore = false;
            if (drawnLayer.pm && typeof drawnLayer.pm.enable === 'function') {
              try {
                drawnLayer.pm.enable();
              } catch {
                /* ignore */
              }
            }
            // attach right-click-to-delete handler to restored layer
            attachContextDelete(layer);
          }
        } catch {
          // ignore
        }
      },
    }).addTo(leafletMap);
  }

  // Prevent Geoman from interacting with preloaded layers (countries, regions, cities)
  function disableGeomanOnPreloadedLayers(map: L.Map): void {
    map.eachLayer((layer: L.Layer) => {
      try {
        // skip user-drawn layers (they have `drawnId` set)
        if ((layer as DrawnLayer).drawnId) return;

        const maybe = layer as unknown as {
          options?: Record<string, unknown>;
          pm?: { disable?: () => void } & Record<string, unknown>;
          eachLayer?: (fn: (l: L.Layer) => void) => void;
        };

        maybe.options = maybe.options || {};
        (maybe.options as Record<string, unknown>).pmIgnore = true;
        if (maybe.pm && typeof maybe.pm.disable === 'function') {
          try {
            maybe.pm.disable();
          } catch {
            /* ignore */
          }
        }

        // if the layer is a group (e.g., geoJSON group), apply to sublayers as well
        if (typeof maybe.eachLayer === 'function') {
          try {
            maybe.eachLayer!((sub: L.Layer) => {
              if ((sub as DrawnLayer).drawnId) return;
              const ms = sub as unknown as {
                options?: Record<string, unknown>;
                pm?: { disable?: () => void };
              };
              ms.options = ms.options || {};
              (ms.options as Record<string, unknown>).pmIgnore = true;
              if (ms.pm && typeof ms.pm.disable === 'function') {
                try {
                  ms.pm.disable();
                } catch {
                  /* ignore */
                }
              }
            });
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore per-layer errors
      }
    });
  }

  // run once to protect preloaded layers
  disableGeomanOnPreloadedLayers(leafletMap);

  // persist view on move end
  leafletMap.on('moveend', () => {
    const c = leafletMap.getCenter();
    mapStore.center = [c.lat, c.lng];
    mapStore.zoom = leafletMap.getZoom();
  });

  // Geoman initialization
  if (isGeoman(pm)) {
    if (typeof pm.setLang === 'function') pm.setLang('ru');
    if (typeof pm.addControls === 'function')
      pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: true,
        drawPolygon: true,
        drawRectangle: true,
        editMode: true,
        dragMode: true,
        removalMode: true,
      });

    // Remove/hide rotate control — Geoman may add a rotate button in the actions container.
    // We hide it with CSS (see style below) and also remove it from DOM after controls are created.
    try {
      const removeRotateControls = () => {
        const toolbar =
          document.querySelector('.leaflet-pm-toolbar') ||
          document.querySelector('.leaflet-buttons');
        if (!toolbar) return;
        // remove rotate icon elements and their containers
        toolbar
          .querySelectorAll('.leaflet-pm-icon-rotate, .control-icon.leaflet-pm-icon-rotate')
          .forEach((el) => {
            const container =
              (el as HTMLElement).closest('.button-container') || (el as HTMLElement).parentElement;
            if (container) container.remove();
            else (el as HTMLElement).remove();
          });
        // remove any button containers whose title contains "поворот" (case-insensitive)
        toolbar.querySelectorAll('.button-container').forEach((el) => {
          try {
            const title = (el as HTMLElement).getAttribute('title') || '';
            if (title.toLowerCase().includes('поворот')) (el as HTMLElement).remove();
          } catch {}
        });
        // remove individual actions with a rotate title
        toolbar.querySelectorAll('.leaflet-pm-action').forEach((el) => {
          try {
            const title = (el as HTMLElement).getAttribute('title') || '';
            if (title.toLowerCase().includes('поворот')) (el as HTMLElement).remove();
          } catch {}
        });
      };
      // call once after a short delay to let Geoman render its toolbar
      setTimeout(removeRotateControls, 200);
      // and observe toolbar for future changes
      const toolbarNode =
        document.querySelector('.leaflet-pm-toolbar') || document.querySelector('.leaflet-buttons');
      if (toolbarNode && typeof MutationObserver !== 'undefined') {
        const obs = new MutationObserver(removeRotateControls);
        obs.observe(toolbarNode, { childList: true, subtree: true });
      }
    } catch {
      // ignore failures — this is best-effort
    }
  }

  // Toggle map interactions to avoid input conflicts when Geoman tools are active
  function setMapInteractivity(enabled: boolean) {
    const map = leafletMap;
    if (!map) return;
    try {
      if (enabled) {
        if (!map.dragging.enabled()) map.dragging.enable();
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        if (map.boxZoom) map.boxZoom.enable();
        if (map.keyboard) map.keyboard.enable();
      } else {
        if (map.dragging.enabled()) map.dragging.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        if (map.boxZoom) map.boxZoom.disable();
        if (map.keyboard) map.keyboard.disable();
      }
    } catch (err) {
      // ignore: some builds may not expose every control
      console.warn('setMapInteractivity failed', err);
    }
  }

  // Geoman events: disable map interactions while drawing or editing
  leafletMap.on('pm:drawstart', () => setMapInteractivity(false));
  leafletMap.on('pm:drawend', () => setMapInteractivity(true));
  leafletMap.on('pm:editstart', () => setMapInteractivity(false));
  leafletMap.on('pm:editend', () => setMapInteractivity(true));
  leafletMap.on('pm:globaleditmodetoggled', (e: { enabled?: boolean }) =>
    setMapInteractivity(!Boolean(e?.enabled)),
  );
  leafletMap.on('pm:dragstart', () => setMapInteractivity(false));
  leafletMap.on('pm:dragend', () => setMapInteractivity(true));

  leafletMap.on('pm:create', (e: { layer: L.Layer; shape?: string }) => {
    const layer = e.layer as DrawnLayer | Polyline | Polygon;
    const getLatLngs = (layer as DrawnLayer).getLatLngs;
    if (import.meta.env.DEV) {
      console.debug(
        'Создано:',
        e.shape,
        typeof getLatLngs === 'function' ? getLatLngs.call(layer) : undefined,
      );
    }
    const dl = layer as DrawnLayer & PMAttachable & { options?: Record<string, unknown> };
    dl.drawnId = dl.drawnId ?? generateDrawnId();
    dl.options = dl.options || {};
    (dl.options as Record<string, unknown>).pmIgnore = false;
    if (dl.pm && typeof dl.pm.enable === 'function') {
      try {
        dl.pm.enable();
      } catch {
        /* ignore */
      }
    }
    // attach right-click-to-delete handler
    attachContextDelete(layer);
    persistAllDrawnLayers(leafletMap);
  });

  // Right-click cancels active Geoman tool (draw/edit) and re-enables map interactivity
  leafletMap.on('contextmenu', () => {
    try {
      if (isGeoman(pm)) {
        if (typeof pm.disableDraw === 'function') pm.disableDraw();
        if (typeof pm.disableGlobalEditMode === 'function') pm.disableGlobalEditMode();
      }
    } catch {
      // ignore
    }
    mapStore.activeTool = null;
    mapStore.globalEdit = false;
    setMapInteractivity(true);
    // do not automatically cancel the delete bubble here — allow layer-level handlers to show it
  });

  // hide bubble on common map interactions
  leafletMap.on('move', cancelDeleteBubble);
  leafletMap.on('zoom', cancelDeleteBubble);
  leafletMap.on('pm:drawstart', cancelDeleteBubble);
  leafletMap.on('pm:create', cancelDeleteBubble);

  // Pressing Escape should cancel active Geoman tools (same as right-click)
  const onEscapeKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    try {
      if (isGeoman(pm)) {
        if (typeof pm.disableDraw === 'function') pm.disableDraw();
        if (typeof pm.disableGlobalEditMode === 'function') pm.disableGlobalEditMode();
      }
    } catch {
      // ignore
    }
    mapStore.activeTool = null;
    mapStore.globalEdit = false;
    setMapInteractivity(true);
  };
  try {
    document.addEventListener('keydown', onEscapeKey);
  } catch {
    // ignore
  }
  onBeforeUnmount(() => {
    try {
      document.removeEventListener('keydown', onEscapeKey);
    } catch {
      // ignore
    }
  });

  // Measurement wiring: call top-level helper functions that manage measurements
  const mapEvents = leafletMap as L.Map;
  type GeomanEvent = LeafletEvent & { shape?: string; layer?: unknown; latlng?: L.LatLng };

  // Attach measurement update listeners when edit starts
  mapEvents.on('pm:editstart', (e: GeomanEvent) => {
    const layer = e?.layer as unknown as PmLayer | undefined;
    if (layer) attachEditListeners(layer);
    setMapInteractivity(false);
  });

  mapEvents.on('pm:drawstart', (e: GeomanEvent) => {
    const shape = (e?.shape as string) ?? '';
    startDrawMode(shape);
    setMapInteractivity(false);
  });
  mapEvents.on('pm:drawvertex', (e: GeomanEvent) => onDrawVertex(e));
  mapEvents.on('pm:drawend', () => {
    stopDrawMode();
    setMapInteractivity(true);
  });
  mapEvents.on('pm:create', (e: GeomanEvent) => {
    stopDrawMode();
    try {
      const layer = e.layer as unknown as PmLayer & DrawnLayer;
      if (layer && typeof layer.getLatLngs === 'function') {
        const ll = layer.getLatLngs() as unknown;
        const pts: L.LatLng[] = ([] as L.LatLng[]).concat(...(ll as unknown as L.LatLng[][]));
        if (layer instanceof L.Polygon) {
          measurementMode.value = 'area';
          measurementText.value = formatArea(computeAreaLatLngs(pts));
        } else if (layer instanceof L.Polyline) {
          measurementMode.value = 'distance';
          measurementText.value = formatDistance(computeLengthLatLngs(pts));
        }
        setTimeout(() => (measurementText.value = ''), 3000);
        const dl2 = layer as DrawnLayer & PMAttachable & { options?: Record<string, unknown> };
        dl2.drawnId = dl2.drawnId ?? generateDrawnId();
        dl2.options = dl2.options || {};
        (dl2.options as Record<string, unknown>).pmIgnore = false;
        if (dl2.pm && typeof dl2.pm.enable === 'function') {
          try {
            dl2.pm.enable();
          } catch {
            /* ignore */
          }
        }
        persistAllDrawnLayers(leafletMap);
      }
    } catch {
      // ignore
    }
    setMapInteractivity(true);
  });
  // persist after edits/removals are already wired later
  mapEvents.on('pm:editend', (e: GeomanEvent) => {
    const layer = e?.layer as unknown as PmLayer | undefined;
    if (layer) detachEditListeners(layer);
    measurementText.value = '';
    // persist after edits
    persistAllDrawnLayers(leafletMap);
    setMapInteractivity(true);
  });
  leafletMap.on('pm:remove', () => persistAllDrawnLayers(leafletMap));

  // Marker clustering
  if (citiesWithCoords.value.length) {
    if (markerClusterGroup) {
      leafletMap.removeLayer(markerClusterGroup);
      markerClusterGroup = null;
    }
    const created = createMarkerClusterGroup();
    if (created) {
      markerClusterGroup = created;
      citiesWithCoords.value.forEach((city) => {
        const marker = L.marker(city.coords, { icon: greenIcon });
        marker.bindPopup(`<strong>${city.city_name}</strong>`);
        markerClusterGroup!.addLayer(marker);
      });
      leafletMap.addLayer(markerClusterGroup);
      // ensure marker clusters and their markers are ignored by Geoman
      try {
        disableGeomanOnPreloadedLayers(leafletMap);
      } catch {}
    }
  }
}, 150);
watch([citiesWithCoords, countriesWithCoords, regionsWithCoords], () => initMap());
</script>

<style>
.leaflet-pm-toolbar {
  z-index: 1000 !important;
}

/* Increase Geoman toolbar and button sizes for better usability (very large) */
.leaflet-pm-toolbar {
  --pm-btn-size: 120px; /* button width/height */
  --pm-icon-size: 72px; /* inner icon size */
}
/* Ultra-specific overrides to enforce size */
.leaflet-pm-toolbar,
.leaflet-pm-toolbar * {
  z-index: 1100 !important;
}
.leaflet-pm-toolbar .leaflet-pm-button {
  width: var(--pm-btn-size) !important;
  height: var(--pm-btn-size) !important;
  min-width: var(--pm-btn-size) !important;
  min-height: var(--pm-btn-size) !important;
  padding: 14px !important;
  margin: 8px !important;
  border-radius: 14px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15) !important;
  background: rgba(255, 255, 255, 0.98) !important;
}
.leaflet-pm-toolbar .leaflet-pm-button .leaflet-pm-icon,
.leaflet-pm-toolbar .leaflet-pm-button svg,
.leaflet-pm-toolbar .leaflet-pm-button svg * {
  width: var(--pm-icon-size) !important;
  height: var(--pm-icon-size) !important;
}
.leaflet-pm-toolbar .leaflet-pm-container {
  gap: 12px !important;
  padding: 8px !important;
}
/* High-density screens: make even larger */
@media (min-resolution: 2dppx) {
  .leaflet-pm-toolbar {
    --pm-btn-size: 150px;
    --pm-icon-size: 96px;
  }
}
/* Small screens: clamp size down to avoid overflow */
@media (max-width: 480px) {
  .leaflet-pm-toolbar {
    --pm-btn-size: 80px;
    --pm-icon-size: 48px;
  }
  .leaflet-pm-toolbar .leaflet-pm-container {
    gap: 8px !important;
  }
}
.measurement-badge {
  position: fixed;
  right: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.72);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  z-index: 2000;
}

.leaflet-pm-toolbar {
  z-index: 1000 !important;
}

/* Explicitly hide rotate icon and rotate controls (best-effort) */
.control-icon.leaflet-pm-icon-rotate,
.leaflet-pm-icon-rotate {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
.button-container[title*='Поворот'],
.button-container[title*='поворот'] {
  display: none !important;
  visibility: hidden !important;
}
.leaflet-pm-action[title*='Поворот'],
.leaflet-pm-action[title*='поворот'] {
  display: none !important;
  visibility: hidden !important;
}

/* Delete confirmation modal styles */
.confirm-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 3000;
}
.confirm-dialog {
  background: #ffffff;
  border-radius: 10px;
  padding: 20px 28px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  text-align: center;
}
.confirm-icon {
  font-size: 42px;
  margin-bottom: 8px;
}
.confirm-title {
  margin: 0 0 6px 0;
  font-size: 18px;
}
.confirm-body {
  margin: 0 0 18px 0;
  color: #333;
  opacity: 0.9;
}
.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.btn {
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.btn-delete {
  background: #d93f3f;
  color: white;
}
.btn-cancel {
  background: #f0f0f0;
  color: #222;
}

/* Inline delete bubble (visual: only the red circular button) */
.delete-bubble {
  position: absolute;
  /* slightly less offset so the button sits snug above the element */
  transform: translate(-50%, -110%);
  background: transparent; /* remove white background */
  padding: 0;
  box-shadow: none;
  z-index: 3500;
  pointer-events: none; /* avoid capturing clicks — let the inner button handle them */
}
.delete-bubble > .btn-bubble {
  pointer-events: auto;
}
.btn-bubble {
  background: #d93f3f;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: none;
  cursor: pointer;
}
.btn-bubble:active {
  transform: scale(0.98);
}
</style>
