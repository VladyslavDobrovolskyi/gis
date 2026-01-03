import L from 'leaflet';
import {
  measurementMode,
  measurementText,
  onDrawVertex,
  startDrawMode,
  stopDrawMode,
  attachEditListeners,
  detachEditListeners,
} from './useMeasurements';
import {
  computeLengthLatLngs,
  computeAreaLatLngs,
  formatDistance,
  formatArea,
} from '@/lib/measurements';
import { markLayerAsUser } from './useLayerHelpers';
import { persistAllDrawnLayers } from './usePersistDrawn';
import { setMapInteractivity } from './useMapInteractivity';
import { clearHoverState } from './useHover';
import type { PmLayer, DrawnLayer, LayerWithEach, GeomanPM } from '@/types/leaflet.types';

// Attach a consolidated set of Geoman event handlers to a Leaflet map.
export function attachGeomanEvents(map: L.Map): () => void {
  if (!map) return () => {};

  const handlers: Array<() => void> = [];

  const add = <T = unknown>(ev: string, fn: (e: T) => void) => {
    try {
      map.on(ev, fn as unknown as L.LeafletEventHandlerFn);
      handlers.push(() => map.off(ev, fn as unknown as L.LeafletEventHandlerFn));
    } catch {
      /* ignore */
    }
  };

  // Toggle map interactions to avoid input conflicts when Geoman tools are active
  add('pm:drawstart', () => setMapInteractivity(map, false));
  add('pm:drawend', () => setMapInteractivity(map, true));
  add('pm:editstart', () => setMapInteractivity(map, false));
  add('pm:editend', () => setMapInteractivity(map, true));
  add<{ enabled?: boolean }>('pm:globaleditmodetoggled', (e) =>
    setMapInteractivity(map, !Boolean(e?.enabled)),
  );
  add('pm:dragstart', () => setMapInteractivity(map, false));
  add('pm:dragend', () => setMapInteractivity(map, true));

  // Right-click cancels active Geoman tool and re-enables interactivity
  add('contextmenu', () => {
    try {
      const pm = map.pm;
      if (pm && typeof pm.disableDraw === 'function') {
        try {
          pm.disableDraw();
        } catch {}
      }
      if (pm && typeof pm.disableGlobalEditMode === 'function') {
        try {
          const anyPm = pm as GeomanPM;
          if (
            typeof anyPm._layerAddedEdit === 'function' &&
            typeof anyPm.throttledReInitEdit === 'function'
          ) {
            try {
              pm.disableGlobalEditMode();
            } catch {
              /* ignore */
            }
          } else {
            // fallback - best-effort
            try {
              // attempt to disable PM on layers (caller may re-run this)
            } catch {}
          }
        } catch {}
      }
    } catch {}
    // reset top-level flags
    try {
      // mapStore must be updated by the caller if needed
    } catch {}
    setMapInteractivity(map, true);
  });

  // measurement wiring: attach and handle measurement updates
  add<{ layer?: PmLayer }>('pm:editstart', (e) => {
    try {
      const layer = e?.layer as PmLayer | undefined;
      if (layer) attachEditListeners(layer);
      setMapInteractivity(map, false);
    } catch {}
  });

  add<{ shape?: string }>('pm:drawstart', (e) => {
    try {
      const shape = (e?.shape as string) ?? '';
      startDrawMode(map, shape);
      setMapInteractivity(map, false);
    } catch {}
  });

  add<{ latlng?: L.LatLng }>('pm:drawvertex', (e) => onDrawVertex(e));

  add('pm:drawend', () => {
    try {
      stopDrawMode(map);
      setMapInteractivity(map, true);
    } catch {}
  });

  add<{ layer?: PmLayer }>('pm:create', (e) => {
    try {
      // detailed create: measurement + marking
      const layer = e.layer as PmLayer & DrawnLayer;
      if (!layer) return;
      // Circles
      if (layer instanceof L.Circle) {
        try {
          const r = (layer as L.Circle).getRadius();
          const area = Math.PI * r * r;
          measurementMode.value = 'area';
          measurementText.value = `${formatDistance(r)} • ${formatArea(area)}`;
        } catch {}

        markLayerAsUser(map, layer);
        setTimeout(() => (measurementText.value = ''), 3000);
        persistAllDrawnLayers(map);
        setMapInteractivity(map, true);
        return;
      }

      if (typeof layer.getLatLngs === 'function') {
        try {
          const ll = layer.getLatLngs();
          const nested = Array.isArray(ll) ? (ll as L.LatLng[][]) : ([] as L.LatLng[][]);
          const pts: L.LatLng[] = ([] as L.LatLng[]).concat(...nested);
          if (layer instanceof L.Polygon) {
            measurementMode.value = 'area';
            measurementText.value = formatArea(computeAreaLatLngs(pts));
          } else if (layer instanceof L.Polyline) {
            measurementMode.value = 'distance';
            measurementText.value = formatDistance(computeLengthLatLngs(pts));
          }
          setTimeout(() => (measurementText.value = ''), 3000);
        } catch {}
        markLayerAsUser(map, layer);
        persistAllDrawnLayers(map);
      }
    } catch {}
    setMapInteractivity(map, true);
  });

  add<{ layer?: L.Layer; layers?: L.Layer[] }>('pm:cut', (e) => {
    try {
      const maybe = e as { layer?: L.Layer; layers?: L.Layer[] };
      function processLayer(l: L.Layer | null | undefined) {
        if (!l) return;
        markLayerAsUser(map, l);
      }

      if (maybe.layer) {
        const l = maybe.layer;
        if (
          (l as LayerWithEach).eachLayer &&
          typeof (l as LayerWithEach).eachLayer === 'function'
        ) {
          try {
            (l as LayerWithEach).eachLayer!((sub: L.Layer) => processLayer(sub));
          } catch {}
        } else {
          processLayer(l);
        }
      }

      if (maybe.layers && Array.isArray(maybe.layers)) {
        try {
          (maybe.layers as L.Layer[]).forEach((ll) => processLayer(ll));
        } catch {}
      }

      persistAllDrawnLayers(map);
    } catch {}
  });

  add<{ layer?: PmLayer }>('pm:editend', (e) => {
    try {
      const layer = e?.layer as PmLayer | undefined;
      if (layer) detachEditListeners(layer);
      measurementText.value = '';
      persistAllDrawnLayers(map);
      setMapInteractivity(map, true);
    } catch {}
  });

  add<{ layer?: L.Layer }>('pm:remove', (e) => {
    try {
      if (e?.layer) {
        try {
          detachEditListeners(e.layer);
        } catch {}
        try {
          clearHoverState();
        } catch {}
      }
    } catch {}
    persistAllDrawnLayers(map);
  });

  // return detach function for caller to call during component cleanup
  return () => {
    handlers.forEach((h) => {
      try {
        h();
      } catch {}
    });
  };
}
