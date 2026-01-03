import { onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import type { LMap } from '@vue-leaflet/vue-leaflet';
import L from 'leaflet';
import { cancelDeleteBubble, deleteLayerImmediate } from '@/composables/useDelete';

export function useDeleteConfirm(mapRef: Ref<InstanceType<typeof LMap> | null>): void {
  const handler = (e: Event) => {
    try {
      const detail = (e as CustomEvent)?.detail as { layer?: L.Layer } | undefined;
      const layer = detail?.layer as L.Layer | undefined;
      const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
      if (layer && leafletMap) {
        try {
          deleteLayerImmediate(leafletMap, layer);
        } catch {
          /* ignore */
        }
      }
      cancelDeleteBubble();
    } catch {
      /* ignore */
    }
  };

  try {
    window.addEventListener('map:delete-confirm', handler);
  } catch {
    /* ignore */
  }

  onBeforeUnmount(() => {
    try {
      window.removeEventListener('map:delete-confirm', handler);
    } catch {
      /* ignore */
    }
  });
}
