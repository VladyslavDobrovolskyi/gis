<template>
  <l-map :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap contributors"
    />

    <l-marker v-for="city in citiesWithCoords" :key="city.id" :lat-lng="city.coords">
      <l-popup>
        <strong>{{ city.name }}</strong
        ><br />
        Population: {{ city.population }}
      </l-popup>
    </l-marker>

    <l-polyline v-if="polylinePoints" :lat-lngs="polylinePoints" color="red" />
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LPolyline } from '@vue-leaflet/vue-leaflet';
import { trpc } from './trpc';
import type { City, IGetDistanceFromToResult } from '@gis/shared/schemas';

/* -------------------- state -------------------- */

const cities = ref<City[]>([]);
const distance = ref<IGetDistanceFromToResult | null>(null);

/* -------------------- helpers -------------------- */

/**
 * Парсит строку WKT POINT в массив координат [lat, lon]
 * Leaflet ожидает [latitude, longitude]
 */
const parsePoint = (geometry: string | null): [number, number] | null => {
  if (!geometry) return null;

  const match = geometry.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
  if (!match) return null;

  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);

  if (isNaN(lat) || isNaN(lon)) return null;

  return [lat, lon];
};

/* -------------------- computed -------------------- */

/**
 * Фильтруем города и сразу прикрепляем распарсенные координаты.
 * Это решает проблему Type 'null' is not assignable to type 'LatLngExpression'.
 */
const citiesWithCoords = computed(() => {
  return (
    cities.value
      .map((city) => ({
        ...city,
        coords: parsePoint(city.geometry),
      }))
      // Используем Type Guard, чтобы TS понимал, что coords больше не null
      .filter((city): city is typeof city & { coords: [number, number] } => city.coords !== null)
  );
});

/**
 * Вычисляем точки для линии между городами
 */
const polylinePoints = computed<[number, number][] | null>(() => {
  if (!distance.value || !cities.value.length) return null;

  const from = cities.value.find((c) => c.name === distance.value!.city_from);
  const to = cities.value.find((c) => c.name === distance.value!.city_to);

  if (!from || !to) return null;

  const fromPoint = parsePoint(from.geometry);
  const toPoint = parsePoint(to.geometry);

  if (!fromPoint || !toPoint) return null;

  return [fromPoint, toPoint];
});

/* -------------------- lifecycle -------------------- */

onMounted(async () => {
  try {
    // tRPC автоматически подхватывает типы из бэкенда
    const [citiesRes, distanceRes] = await Promise.all([
      trpc.cities.getAll.query(),
      trpc.cities.distance.query({ from: 'Kyiv', to: 'Lviv' }),
    ]);

    cities.value = citiesRes;
    distance.value = distanceRes;
  } catch (err) {
    console.error('tRPC Error:', err);
  }
});
</script>
