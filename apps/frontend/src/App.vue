<template>
  <l-map :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <!-- Tiles -->
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap contributors"
    />

    <!-- Markers -->
    <l-marker v-for="city in cities" :key="city.id" :lat-lng="parsePoint(city.geometry)">
      <l-popup>
        <strong>{{ city.name }}</strong
        ><br />
        Population: {{ city.population }}
      </l-popup>
    </l-marker>

    <!-- Polyline -->
    <l-polyline v-if="polylinePoints" :lat-lngs="polylinePoints" color="red" />
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LPolyline } from '@vue-leaflet/vue-leaflet';
import {
  CitiesSchema,
  GetDistanceFromToResultSchema,
  type City,
  type IGetDistanceFromToResult,
} from '@gis/shared/schemas';

const API_URL = import.meta.env.VITE_API_URL;

/* -------------------- state -------------------- */

const cities = ref<City[]>([]);
const distance = ref<IGetDistanceFromToResult | null>(null);

/* -------------------- helpers -------------------- */

const parsePoint = (geometry: string | null): [number, number] | null => {
  if (!geometry) return null;

  // geometry format: "POINT(lon lat)"
  const match = geometry.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
  if (!match) return null;

  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);

  return [lat, lon];
};

/* -------------------- computed -------------------- */

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
    const citiesRes = await fetch(`${API_URL}/`);

    cities.value = CitiesSchema.parse(await citiesRes.json());

    const distanceRes = await fetch(`${API_URL}/distance?from=Kyiv&to=Lviv`);
    distance.value = GetDistanceFromToResultSchema.parse(await distanceRes.json());
  } catch (err) {
    alert('Error fetching data. See console for details.');
    console.error('Error fetching data:', err);
  }
});
</script>
