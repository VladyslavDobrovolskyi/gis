import { onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import L from 'leaflet';
import { isGeoman } from '@/lib/guards';
import type { GeomanPM, PMAttachable } from '@/types/leaflet.types';
import type { LMap } from '@vue-leaflet/vue-leaflet';

// Lightweight, focussed composable for Escape key behavior used in App.vue
export function useEscapeHandler(
  mapRef: Ref<InstanceType<typeof LMap> | null>,
  mapStore: ReturnType<typeof import('@/stores/map.store').useMapStore> | null,
): void {
  const onEscape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    try {
      const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
      const pmLocal = (leafletMap as L.Map & { pm?: GeomanPM })?.pm;

      if (isGeoman(pmLocal)) {
        try {
          if (typeof pmLocal.disableDraw === 'function') pmLocal.disableDraw();
        } catch {}

        try {
          if (typeof pmLocal.disableGlobalEditMode === 'function') {
            try {
              const anyPm = pmLocal as unknown as Record<string, unknown>;
              if (
                typeof (anyPm as Record<string, unknown>)._layerAddedEdit === 'function' &&
                typeof (anyPm as Record<string, unknown>).throttledReInitEdit === 'function'
              ) {
                try {
                  pmLocal.disableGlobalEditMode();
                } catch {}
              } else {
                const mapL = mapRef.value?.leafletObject as L.Map | undefined;
                if (mapL) {
                  try {
                    mapL.eachLayer((layer: L.Layer & PMAttachable) => {
                      try {
                        const lpm = layer.pm;
                        if (lpm && typeof lpm.disable === 'function') {
                          try {
                            lpm.disable();
                          } catch {}
                        }
                      } catch {}
                    });
                  } catch {}
                }
              }
            } catch {}
          }
        } catch {}
      }

      if (leafletMap) {
        try {
          if (leafletMap.dragging && !leafletMap.dragging.enabled()) leafletMap.dragging.enable();
          if (leafletMap.scrollWheelZoom && typeof leafletMap.scrollWheelZoom.enable === 'function')
            leafletMap.scrollWheelZoom.enable();
          if (leafletMap.doubleClickZoom && typeof leafletMap.doubleClickZoom.enable === 'function')
            leafletMap.doubleClickZoom.enable();
          if (leafletMap.boxZoom && typeof leafletMap.boxZoom.enable === 'function')
            leafletMap.boxZoom.enable();
          if (leafletMap.keyboard && typeof leafletMap.keyboard.enable === 'function')
            leafletMap.keyboard.enable();
        } catch {
          /* ignore */
        }
      }
    } catch {
      // ignore
    }

    try {
      const ms = mapStore as ReturnType<typeof import('@/stores/map.store').useMapStore> | null;
      if (ms) {
        ms.activeTool = null;
        ms.globalEdit = false;
      }
    } catch {
      /* ignore */
    }
  };

  try {
    document.addEventListener('keydown', onEscape);
  } catch {
    /* ignore */
  }

  onBeforeUnmount(() => {
    try {
      document.removeEventListener('keydown', onEscape);
    } catch {
      /* ignore */
    }
  });
}
