<template>
  <l-map ref="mapRef" :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap contributors"
    />

    <!-- Markers will be added via markercluster in onMounted -->

    <l-polygon
      v-for="country in countriesWithCoords"
      :key="'country-' + country.ogc_fid"
      :lat-lngs="country.coords"
      color="green"
      :fill-opacity="0.15"
    />
    <l-polygon
      v-for="city in citiesWithPolygonCoords"
      :key="'city-' + city.ogc_fid"
      :lat-lngs="city.geometry"
      color="blue"
      :fill-opacity="0.25"
    />
    <l-polygon
      v-for="region in regionsWithCoords"
      :key="'region-' + region.ogc_fid"
      :lat-lngs="region.coords"
      color="orange"
      :fill-opacity="0.18"
    />
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { LMap, LTileLayer, LPolygon } from '@vue-leaflet/vue-leaflet';
import { trpc } from './trpc';
import type { City, Country, Region } from '@gis/shared/schemas';
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

const cities = ref<City[]>([]);
const countries = ref<Country[]>([]);
const regions = ref<Region[]>([]);

function getPolygonCoordsFromGeoJSON(geom: string | null): [number, number][][] {
  if (!geom) return [];
  try {
    const geo = JSON.parse(geom);
    if (geo.type === 'Polygon' && Array.isArray(geo.coordinates)) {
      // Polygon: coordinates: [ [ [lng, lat], ... ] ]
      return geo.coordinates.map((ring: [number, number][]) =>
        ring.map(([lng, lat]) => [lat, lng]),
      );
    }
    if (geo.type === 'MultiPolygon' && Array.isArray(geo.coordinates)) {
      // MultiPolygon: coordinates: [ [ [ [lng, lat], ... ] ] ]
      return geo.coordinates
        .flat()
        .map((ring: [number, number][]) => ring.map(([lng, lat]) => [lat, lng]));
    }
  } catch {
    return [];
  }
  return [];
}

function getPointCoordsFromGeoJSON(geom: string | null): [number, number] | null {
  if (!geom) return null;
  try {
    const geo = JSON.parse(geom);
    if (geo.type === 'Point' && Array.isArray(geo.coordinates)) {
      const [lng, lat] = geo.coordinates as [number, number];
      return [lat, lng];
    }
  } catch {
    return null;
  }
  return null;
}

const countriesWithCoords = computed(() => {
  return countries.value
    .map((c) => ({
      ...c,
      coords: getPolygonCoordsFromGeoJSON(c.geom)[0] || [],
    }))
    .filter((c) => c.coords.length > 0);
});

const citiesWithCoords = computed(() => {
  return cities.value
    .map((city) => ({
      ...city,
      coords: getPointCoordsFromGeoJSON(city.geom),
    }))
    .filter((city) => city.coords !== null)
    .map((city) => ({ ...city, coords: city.coords as [number, number] }));
});

const citiesWithPolygonCoords = computed(() => {
  return cities.value
    .map((city) => ({
      ...city,
      geometryParsed: getPolygonCoordsFromGeoJSON(city.geom),
    }))
    .filter((city) => city.geometryParsed.length > 0)
    .map((city) => ({ ...city, geometry: city.geometryParsed[0] }));
});

const regionsWithCoords = computed(() => {
  return regions.value
    .map((r) => ({
      ...r,
      coords: getPolygonCoordsFromGeoJSON(r.geom)[0] || [],
    }))
    .filter((r) => r.coords.length > 0);
});

/* -------------------- lifecycle -------------------- */

onMounted(async () => {
  try {
    const [citiesRes, countriesRes, regionsRes] = await Promise.all([
      trpc.cities.getCities.query(),
      trpc.countries.getCountries.query(),
      trpc.regions.getRegions.query(),
    ]);
    console.log('Cities from API:', JSON.stringify(citiesRes, null, 2));
    console.log('Countries from API:', JSON.stringify(countriesRes, null, 2));
    console.log('Regions from API:', JSON.stringify(regionsRes, null, 2));
    cities.value = citiesRes;
    countries.value = countriesRes;
    regions.value = regionsRes;

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
        marker.bindPopup(`<strong>${city.city_name}</strong>`);
        markerClusterGroup!.addLayer(marker);
      });
      leafletMap.addLayer(markerClusterGroup);
    }
  } catch (err) {
    console.error('tRPC Error:', err);
  }
});
</script>
