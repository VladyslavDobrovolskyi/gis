import type L from 'leaflet';
import type { DrawnLayer } from '@/types/leaflet.types';
import { useMapStore } from '@/stores/map.store';

function getMapStore() {
  try {
    return useMapStore();
  } catch {
    return null as null | ReturnType<typeof useMapStore>;
  }
}

export function generateDrawnId(): string {
  // Safe access to a platform-provided UUID implementation if available
  const g = globalThis as { crypto?: { randomUUID?: () => string } } | undefined;
  if (g && g.crypto && typeof g.crypto.randomUUID === 'function') {
    try {
      return g.crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`;
}

export function persistAllDrawnLayers(map: L.Map): void {
  const features: GeoJSON.Feature[] = [];
  map.eachLayer((layer: L.Layer) => {
    try {
      // Persist layers that are not explicitly ignored by Geoman (pmIgnore)
      const maybeDrawn = layer as DrawnLayer;
      const opts = (layer as L.Layer & { options?: Record<string, unknown> }).options || {};
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
  const ms = getMapStore();
  if (ms) ms.drawn = fc;
}
