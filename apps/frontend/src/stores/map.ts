import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useMapStore = defineStore('map', () => {
  // persisted map view (lat, lng order)
  const center = useStorage('map:center', [50.45, 30.52] as [number, number]);
  const zoom = useStorage('map:zoom', 6);

  // persisted measurement state
  const measurementMode = useStorage<'distance' | 'area' | null>('map:measurementMode', null);
  const measurementText = useStorage<string>('map:measurementText', '');

  // persisted drawn GeoJSON features (FeatureCollection)
  const drawn = useStorage<GeoJSON.FeatureCollection | null>('map:drawn', null);

  return { center, zoom, measurementMode, measurementText, drawn };
});
