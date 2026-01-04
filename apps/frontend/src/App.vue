<template>
  <l-map ref="mapRef" :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      :attribution="`© OpenStreetMap contributors | ${LABEL}`"
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
    <MeasurementBadge />
    <DeleteBubble />
  </l-map>
</template>

<script setup lang="ts">
const LABEL = import.meta.env.VITE_FOOTER_LABEL || 'Created by Vladyslav Dobrovolskyi';

import MeasurementBadge from '@/components/MeasurementBadge.vue';
import DeleteBubble from '@/components/DeleteBubble.vue';

import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { trpc } from '@/trpc';
import { useDebounceFn } from '@vueuse/core';
import { useMapStore } from '@/stores/map.store';
import { createMarkerIcon } from '@/lib/marker';

import type { Country, Region, City } from '@gis/shared/schemas';
import type { GeoPoint, GeoPolygon } from '@/types/geo.types';

import { getPolygonCoordsFromGeoJSON, getPointCoordsFromGeoJSON } from '@/composables/useGeo';
import { useEscapeHandler } from '@/composables/useEscape';
import { restoreDrawnFeatures } from '@/composables/usePersistDrawn';

import { useDeleteConfirm } from '@/composables/useDeleteConfirm';
import { disablePmOnAllLayers } from '@/composables/usePm';
import { attachGeomanEvents } from '@/composables/useGeomanEvents';
import { initGeomanToolbarCleanup } from '@/composables/useGeomanToolbar';

import L from 'leaflet';
import { LMap, LTileLayer, LPolygon } from '@vue-leaflet/vue-leaflet';
import { isGeoman } from '@/lib/guards';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet.markercluster';
import type { GeomanPM } from '@/types/leaflet.types';

const mapStore = useMapStore();
const mapRef = ref<InstanceType<typeof LMap> | null>(null);
let markerClusterGroup: L.MarkerClusterGroup | null = null;
const defaultMarkerIcon = createMarkerIcon('green', 'medium');

/* Detach function returned by attachGeomanEvents (registered synchronously below) */
let detachGeomanEvents: null | (() => void) = null;

/* Register component lifecycle cleanup synchronously in setup (avoids calling lifecycle APIs after async awaits) */
onBeforeUnmount(() => {
  try {
    if (typeof detachGeomanEvents === 'function') detachGeomanEvents();
  } catch {}
});

/* Query preloaded geographic data (countries, regions, cities) */

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

/* Process geographic data to extract coordinates */

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

/* Compute coordinates for rendering */

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

/* Cities with polygon geometries (Clusters) */

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

/* Handlers  */

useEscapeHandler(mapRef, mapStore);
useDeleteConfirm(mapRef);

/* Map Initialization */

const initMap = useDebounceFn(async (): Promise<void> => {
  await nextTick();
  const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
  if (!leafletMap) return;

  try {
    const mz = typeof leafletMap.getMaxZoom === 'function' ? leafletMap.getMaxZoom() : undefined;
    if (!Number.isFinite(mz as number)) {
      (leafletMap.options as L.MapOptions).maxZoom = 18;
    }
  } catch {}

  const pm = (leafletMap as L.Map & { pm?: GeomanPM }).pm;

  if (mapStore.center && mapStore.zoom) {
    try {
      leafletMap.setView(mapStore.center as [number, number], mapStore.zoom);
    } catch {
      /* Ignore invalid stored view */
    }
  }

  /* Draw persistence helpers: use `generateDrawnId` and `persistAllDrawnLayers(map)` from '@/composables/usePersistDrawn' */

  /* Attach right-click-to-delete handler to a layer or its sublayers.
     Use `useContextDelete.attachContextDelete` to register the handler. */

  /* Helper: mark a layer as user-drawn, enable PM, attach delete & hover handlers.
     Use `useLayerHelpers.markLayerAsUser` to initialize layer behavior. */

  /* Restore drawn features from persisted store */

  await restoreDrawnFeatures(leafletMap, mapStore.drawn ?? null);

  /* Prevent Geoman (PM) from interacting with preloaded layers (countries, regions, cities) - run once to protect preloaded layers */

  disablePmOnAllLayers(leafletMap);

  /* Persist view on move end */

  leafletMap.on('moveend', () => {
    const c = leafletMap.getCenter();
    mapStore.center = [c.lat, c.lng];
    mapStore.zoom = leafletMap.getZoom();
  });

  /* Geoman initialization */

  if (isGeoman(pm)) {
    if (typeof pm.setLang === 'function') pm.setLang('en');
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

    /* Remove/hide rotate control — Geoman may add a rotate button in the actions container.
       We hide it with CSS (see style below) and also remove it from DOM after controls are created. */
    try {
      try {
        initGeomanToolbarCleanup();
      } catch {
        /* Ignore */
      }
    } catch {
      /* Ignore failures — this is best-effort */
    }
  }

  /* Consolidated Geoman event wiring: use `useGeomanEvents.attachGeomanEvents` */

  try {
    const detach = attachGeomanEvents(leafletMap);
    try {
      detachGeomanEvents = typeof detach === 'function' ? detach : null;
    } catch {}
  } catch {
    /* Ignore */
  }

  /* Marker clustering (without ambient augmentation) */

  if (citiesWithCoords.value && citiesWithCoords.value.length && mapRef.value) {
    const leafletMap = mapRef.value.leafletObject as L.Map;

    /* Remove old cluster group if present */
    if (markerClusterGroup) {
      try {
        if (leafletMap) leafletMap.removeLayer(markerClusterGroup);
      } catch {
        /* Ignore */
      }
      markerClusterGroup = null;
    }

    /* Try to create a new cluster group using factory or constructor */

    let cluster: L.LayerGroup | null = null;
    const maybeFactory = (L as { markerClusterGroup?: () => L.LayerGroup }).markerClusterGroup;
    const maybeCtor = (L as { MarkerClusterGroup?: new () => L.LayerGroup }).MarkerClusterGroup;

    if (typeof maybeFactory === 'function') {
      cluster = maybeFactory();
    } else if (typeof maybeCtor === 'function') {
      cluster = new maybeCtor();
    }

    if (cluster) {
      markerClusterGroup = cluster as L.MarkerClusterGroup;

      for (const city of citiesWithCoords.value) {
        /* Explicitly type coords as [number, number] */
        const marker = L.marker(city.coords as [number, number], {
          icon: defaultMarkerIcon,
        });
        marker.bindPopup(`<strong>${city.city_name}</strong>`);
        markerClusterGroup.addLayer(marker);
      }

      if (leafletMap) {
        leafletMap.addLayer(markerClusterGroup);
      }

      /* Ensure marker clusters and their markers are ignored by Geoman */
      try {
        disablePmOnAllLayers(leafletMap);
      } catch {}
    }
  }
}, 150);

/* Initialize map on component mount and whenever preloaded data changes */

watch([citiesWithCoords, countriesWithCoords, regionsWithCoords], () => initMap());
</script>
