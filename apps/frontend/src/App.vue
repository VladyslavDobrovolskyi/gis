<template>
  <l-map ref="mapRef" :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap contributors"
    />

    <!-- Markers will be added via markercluster in onMounted -->

    <l-polygon
      v-for="country in countriesWithCoords"
      :key="'country-' + country.id"
      :lat-lngs="country.coords"
      color="green"
      :fill-opacity="0.15"
    />
    <l-polygon
      v-for="city in citiesWithPolygonCoords"
      :key="'city-' + city.id"
      :lat-lngs="city.geometry"
      color="blue"
      :fill-opacity="0.25"
    />
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { LMap, LTileLayer, LPolygon } from '@vue-leaflet/vue-leaflet';
import { trpc } from './trpc';
import type { GeoCity, GeoCountry } from '@gis/shared/schemas';

import L from 'leaflet';
import 'leaflet.markercluster';

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

/* -------------------- state -------------------- */

const cities = ref<GeoCity[]>([]);
const countries = ref<GeoCountry[]>([]);
/**
 * Парсит строку WKT MULTIPOLYGON в массив массивов координат [[lat, lon], ...]
 * Поддерживает только MULTIPOLYGON ((()))
 */
const parsePolygon = (geometry: string | null): [number, number][][] => {
  if (!geometry) return [];
  const multiPolyMatch = geometry.match(/^MULTIPOLYGON ?\(\(\((.+)\)\)\)$/);
  if (multiPolyMatch) {
    const coordsStr = multiPolyMatch[1];
    const points = coordsStr.split(',').map((pt) => {
      const [lon, lat] = pt.trim().split(' ').map(Number);
      return [lat, lon] as [number, number];
    });
    return [points];
  }
  const polyMatch = geometry.match(/^POLYGON ?\(\((.+)\)\)$/);
  if (polyMatch) {
    const coordsStr = polyMatch[1];
    const points = coordsStr.split(',').map((pt) => {
      const [lon, lat] = pt.trim().split(' ').map(Number);
      return [lat, lon] as [number, number];
    });
    return [points];
  }
  return [];
};
/* -------------------- computed -------------------- */

/**
 * Фильтруем города и сразу прикрепляем распарсенные координаты.
 * Это решает проблему Type 'null' is not assignable to type 'LatLngExpression'.
 */

const countriesWithCoords = computed(() => {
  return countries.value
    .map((c) => ({
      ...c,
      // LPolygon expects coords: LatLngExpression[] (array of [lat, lng])
      coords: parsePolygon(c.geometry)[0] || [],
    }))
    .filter((c) => c.coords.length > 0);
});

const parsePoint = (geometry: string | null): [number, number] | null => {
  if (!geometry) return null;
  const match = geometry.match(/^POINT ?\(([-\d.]+) ([-\d.]+)\)$/);
  if (match) {
    const lon = Number(match[1]);
    const lat = Number(match[2]);
    return [lat, lon];
  }
  return null;
};

const citiesWithCoords = computed(() => {
  return cities.value
    .map((city) => ({
      ...city,
      coords: parsePoint(city.geometry),
    }))
    .filter((city) => city.coords !== null)
    .map((city) => ({ ...city, coords: city.coords as [number, number] }));
});

/**
 * Города с полигонами (если geometry - POLYGON или MULTIPOLYGON)
 */
const citiesWithPolygonCoords = computed(() => {
  return cities.value
    .map((city) => ({
      ...city,
      geometryParsed: parsePolygon(city.border_geometry),
    }))
    .filter((city) => city.geometryParsed.length > 0)
    .map((city) => ({ ...city, geometry: city.geometryParsed[0] }));
});

/* -------------------- lifecycle -------------------- */

onMounted(async () => {
  try {
    const [citiesRes, countriesRes] = await Promise.all([
      trpc.geo.getCities.query(),
      trpc.geo.getCountries.query(),
    ]);
    cities.value = citiesRes;
    countries.value = countriesRes;

    await nextTick();
    // Wait for map to be available
    const mapComponent = mapRef.value;
    const leafletMap = mapComponent?.leafletObject;
    if (leafletMap && citiesWithCoords.value.length > 0) {
      // Remove previous cluster group if exists
      if (markerClusterGroup) {
        leafletMap.removeLayer(markerClusterGroup);
      }
      markerClusterGroup = L.markerClusterGroup();
      citiesWithCoords.value.forEach((city) => {
        const marker = L.marker(city.coords, { icon: greenIcon });
        marker.bindPopup(`<strong>${city.name}</strong><br/>Population: ${city.population}`);
        markerClusterGroup!.addLayer(marker);
      });
      leafletMap.addLayer(markerClusterGroup);
    }
  } catch (err) {
    console.error('tRPC Error:', err);
  }
});
</script>
