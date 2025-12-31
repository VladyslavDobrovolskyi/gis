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
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { LMap, LTileLayer, LPolygon } from '@vue-leaflet/vue-leaflet';
import { trpc } from './trpc';
import type { City } from '@gis/shared/schemas';
import L, { Polyline, Polygon } from 'leaflet';
import { useQuery } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';

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
let markerClusterGroup: L.MarkerClusterGroup | null = null;

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

/* -------------------- Map init -------------------- */

const initMap = useDebounceFn(async () => {
  await nextTick();
  const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
  if (!leafletMap) return;

  leafletMap.pm.setLang('ru');
  leafletMap.pm.addControls({
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

  leafletMap.on('pm:create', (e) => {
    const layer = e.layer as Polyline | Polygon;
    console.log('Создано:', e.shape, layer.getLatLngs());
  });

  // Right-click cancels active Geoman tool (draw/edit) and re-enables map interactivity
  leafletMap.on('contextmenu', () => {
    // Dispatch Escape keyboard event which Geoman listens to for cancel
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    } catch {
      // ignore
    }

    // Also try safe direct disabling of Geoman if available
    const pm = (leafletMap as unknown as { pm?: unknown }).pm;
    if (
      pm &&
      'disableDraw' in (pm as Record<string, unknown>) &&
      typeof (pm as Record<string, unknown>).disableDraw === 'function'
    ) {
      (pm as Record<string, (...args: unknown[]) => unknown>).disableDraw();
    }
    if (
      pm &&
      'disableGlobalEditMode' in (pm as Record<string, unknown>) &&
      typeof (pm as Record<string, unknown>).disableGlobalEditMode === 'function'
    ) {
      (pm as Record<string, (...args: unknown[]) => unknown>).disableGlobalEditMode();
    }

    // Ensure map is interactive after cancel
    setMapInteractivity(true);
  });

  // Marker clustering
  if (citiesWithCoords.value.length) {
    if (markerClusterGroup) {
      leafletMap.removeLayer(markerClusterGroup);
    }

    markerClusterGroup = L.markerClusterGroup();

    citiesWithCoords.value.forEach((city) => {
      const marker = L.marker(city.coords, { icon: greenIcon });
      marker.bindPopup(`<strong>${city.city_name}</strong>`);
      markerClusterGroup!.addLayer(marker);
    });

    leafletMap.addLayer(markerClusterGroup);
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
</style>
