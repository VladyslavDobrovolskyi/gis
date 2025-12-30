<template>
  <l-map :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap contributors"
    />

    <l-marker
      v-for="city in citiesWithCoords"
      :key="city.id"
      :lat-lng="city.coords"
      :icon="greenIcon"
    >
      <l-popup>
        <strong>{{ city.name }}</strong
        ><br />
        Population: {{ city.population }}
      </l-popup>
    </l-marker>

    <l-polygon
      v-for="country in countriesWithCoords"
      :key="country.id"
      :lat-lngs="country.coords"
      color="green"
      :fill-opacity="0.15"
    />
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LPolygon } from '@vue-leaflet/vue-leaflet';
import { trpc } from './trpc';
import type { GeoCity, GeoCountry } from '@gis/shared/schemas';

import L from 'leaflet';

const greenIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
 * Вычисляем точки для линии между городами
 */

/* -------------------- lifecycle -------------------- */

onMounted(async () => {
  try {
    const [citiesRes, countriesRes] = await Promise.all([
      trpc.geo.getCities.query(),
      trpc.geo.getCountries.query(),
    ]);
    cities.value = citiesRes;
    countries.value = countriesRes;
  } catch (err) {
    console.error('tRPC Error:', err);
  }
});
</script>
