import type L from 'leaflet';
import { useMapStore } from '@/stores/map.store';
import { detachHoverListeners, clearHoverState } from './useHover';
import { persistAllDrawnLayers } from './usePersistDrawn';
import { LayerWithEach } from '@/types/leaflet.types';

function getMapStore() {
  try {
    return useMapStore();
  } catch {
    return null as null | ReturnType<typeof useMapStore>;
  }
}

let bubbleClickAwayHandler: ((e: MouseEvent) => void) | null = null;
let bubbleEscHandler: ((e: KeyboardEvent) => void) | null = null;
let bubbleAutoHideTimer: number | null = null;
let bubbleHideAfterFadeTimer: number | null = null;

export function showDeleteBubble(
  map: L.Map | undefined,
  target: L.Layer | null,
  isGroup = false,
  ev?: L.LeafletMouseEvent,
  autoFadeMs = 3000,
): void {
  let point: L.Point | null = null;
  if (ev && 'containerPoint' in ev && ev.containerPoint) {
    point = ev.containerPoint;
  } else if (ev && ev.latlng && map) {
    point = map.latLngToContainerPoint(ev.latlng);
  } else if (
    map &&
    target &&
    (target as L.Layer & { getBounds?: () => L.LatLngBounds })?.getBounds &&
    typeof (target as L.Layer & { getBounds?: () => L.LatLngBounds }).getBounds === 'function'
  ) {
    try {
      const lw = target as L.Layer & { getBounds?: () => L.LatLngBounds };
      const center = lw.getBounds!().getCenter();
      point = map.latLngToContainerPoint(center);
    } catch {
      /* ignore */
    }
  }

  if (bubbleAutoHideTimer) {
    window.clearTimeout(bubbleAutoHideTimer);
    bubbleAutoHideTimer = null;
  }
  if (bubbleHideAfterFadeTimer) {
    window.clearTimeout(bubbleHideAfterFadeTimer);
    bubbleHideAfterFadeTimer = null;
  }

  const ms = getMapStore();
  if (ms) {
    ms.deleteBubble.layer = target;
    ms.deleteBubble.isGroup = isGroup;
    ms.deleteBubble.fading = false;
  }

  const margin = 8;
  if (ev && ev.originalEvent && (ev.originalEvent as MouseEvent).clientX !== undefined) {
    try {
      const me = ev.originalEvent as MouseEvent;
      const ms = getMapStore();
      if (ms) {
        ms.deleteBubble.clientX = Math.round(me.clientX);
        ms.deleteBubble.clientY = Math.round(me.clientY);
      }
    } catch {
      /* ignore */
    }
  }

  if (
    (getMapStore()?.deleteBubble.clientX == null || getMapStore()?.deleteBubble.clientY == null) &&
    point &&
    map
  ) {
    try {
      const rect = (
        map.getContainer && (map.getContainer() as HTMLElement)
      )?.getBoundingClientRect();
      const ms = getMapStore();
      if (rect && ms) {
        ms.deleteBubble.clientX = Math.round(rect.left + point.x);
        ms.deleteBubble.clientY = Math.round(rect.top + point.y);
      } else if (ms) {
        ms.deleteBubble.clientX = Math.round(point.x);
        ms.deleteBubble.clientY = Math.round(point.y);
      }
    } catch {
      if (point) {
        const ms = getMapStore();
        if (ms) {
          ms.deleteBubble.clientX = Math.round(point.x);
          ms.deleteBubble.clientY = Math.round(point.y);
        }
      }
    }
  }

  const ms2 = getMapStore();
  if (ms2 && (ms2.deleteBubble.clientX == null || ms2.deleteBubble.clientY == null)) {
    ms2.deleteBubble.clientX = Math.round(ms2.deleteBubble.x || 0);
    ms2.deleteBubble.clientY = Math.round(ms2.deleteBubble.y || 0);
  }

  try {
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const ms3 = getMapStore();
    if (ms3) {
      ms3.deleteBubble.clientX = Math.min(
        Math.max(margin, ms3.deleteBubble.clientX ?? 0),
        vw - margin,
      );
      ms3.deleteBubble.clientY = Math.min(
        Math.max(margin, ms3.deleteBubble.clientY ?? 0),
        vh - margin,
      );
    }
  } catch {
    /* ignore */
  }

  const ms4 = getMapStore();
  if (ms4) {
    ms4.deleteBubble.x = Math.max(8, Math.round(point ? point.x : 0));
    ms4.deleteBubble.y = Math.max(8, Math.round(point ? point.y : 0));
    ms4.deleteBubble.visible = true;
  }

  try {
    bubbleClickAwayHandler = (e: MouseEvent) => {
      const el = document.querySelector('.delete-bubble');
      if (el && e.target && el.contains(e.target as Node)) return;
      cancelDeleteBubble();
    };
    bubbleEscHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDeleteBubble();
    };
    document.addEventListener('click', bubbleClickAwayHandler);
    document.addEventListener('keydown', bubbleEscHandler);
  } catch {
    /* ignore */
  }

  try {
    bubbleAutoHideTimer = window.setTimeout(() => {
      const ms = getMapStore();
      if (ms) ms.deleteBubble.fading = true;
      bubbleHideAfterFadeTimer = window.setTimeout(() => cancelDeleteBubble(), 220);
      bubbleAutoHideTimer = null;
    }, autoFadeMs);
  } catch {}
}

export function cancelDeleteBubble(): void {
  const ms = getMapStore();
  if (ms) {
    ms.deleteBubble.visible = false;
    ms.deleteBubble.layer = null;
    ms.deleteBubble.isGroup = false;
  }
  try {
    if (bubbleClickAwayHandler) document.removeEventListener('click', bubbleClickAwayHandler);
    if (bubbleEscHandler) document.removeEventListener('keydown', bubbleEscHandler);
  } catch {
    /* ignore */
  }
  bubbleClickAwayHandler = null;
  bubbleEscHandler = null;
}

export function deleteLayerImmediate(
  map: L.Map | undefined,
  target: L.Layer,
  isGroup = false,
  ev?: L.LeafletMouseEvent,
): void {
  if (!map || !target) return;
  showDeleteBubble(map, target, isGroup, ev, 180);

  try {
    try {
      detachHoverListeners(target as L.Layer);
    } catch {}

    if (isGroup && typeof (target as LayerWithEach).eachLayer === 'function') {
      try {
        (target as LayerWithEach).eachLayer!((sub: L.Layer) => {
          try {
            try {
              detachHoverListeners(sub);
            } catch {}
            if (map.hasLayer(sub)) map.removeLayer(sub);
          } catch {
            /* ignore */
          }
        });
      } catch {
        /* ignore */
      }
    } else {
      try {
        const t = target as L.Layer;
        try {
          detachHoverListeners(t);
        } catch {}
        if (map.hasLayer(t)) map.removeLayer(t);
      } catch {
        /* ignore */
      }
    }

    try {
      clearHoverState();
    } catch {}

    try {
      persistAllDrawnLayers(map);
    } catch {}
  } catch {
    /* ignore */
  }
}
