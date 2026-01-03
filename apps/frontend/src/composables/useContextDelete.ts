import L from 'leaflet';
import { deleteLayerImmediate } from '@/composables/useDelete';

export function attachContextDelete(map: L.Map, layer: L.Layer | null | undefined): void {
  if (!layer || !map) return;

  const maybe = layer as L.Layer & {
    on?: (evName: string, handler: (ev?: L.LeafletEvent) => void) => void;
    off?: (evName: string, handler?: (ev?: L.LeafletEvent) => void) => void;
    eachLayer?: (fn: (l: L.Layer) => void) => void;
    options?: Record<string, unknown>;
    __contextDeleteAttached?: boolean;
  };

  if (maybe.__contextDeleteAttached) return;
  maybe.__contextDeleteAttached = true;

  const handler = (ev?: L.LeafletMouseEvent) => {
    try {
      const clickedLayer = ev?.target as L.Layer | undefined;
      const targetLayer = clickedLayer ?? maybe;

      const tl = targetLayer as L.Layer & { drawnId?: string };
      const isGroupLocal =
        typeof (tl as L.Layer & { eachLayer?: (fn: (l: L.Layer) => void) => void }).eachLayer ===
        'function';

      const isUserLayer =
        Boolean((tl as { drawnId?: unknown }).drawnId) ||
        (isGroupLocal &&
          (() => {
            let found = false;
            try {
              (tl as L.Layer & { eachLayer?: (fn: (l: L.Layer) => void) => void }).eachLayer!(
                (sub: L.Layer) => {
                  if ((sub as { drawnId?: unknown }).drawnId) found = true;
                },
              );
            } catch {
              /* ignore */
            }
            return found;
          })());
      if (!isUserLayer) return;

      ev?.originalEvent?.preventDefault?.();
      ev?.originalEvent?.stopPropagation?.();

      try {
        deleteLayerImmediate(map, tl as L.Layer, isGroupLocal, ev);
      } catch (err) {
        console.warn('deleteLayerImmediate failed', err);
      }
    } catch (err) {
      console.warn('attachContextDelete handler failed', err);
    }
  };

  if (maybe.on) {
    try {
      maybe.on('contextmenu', handler);
    } catch {
      /* ignore */
    }
  }

  if (typeof maybe.eachLayer === 'function') {
    try {
      maybe.eachLayer!((sub: L.Layer) => {
        const s = sub as L.Layer & {
          __contextDeleteAttached?: boolean;
          on?: (ev: string, handler: (ev?: L.LeafletEvent) => void) => void;
        };
        if (s.__contextDeleteAttached) return;
        s.__contextDeleteAttached = true;
        if (s.on) s.on('contextmenu', handler);
      });
    } catch {
      /* ignore */
    }
  }
}
