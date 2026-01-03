import L from 'leaflet';
import { measurementMode, measurementText } from './useMeasurements';
import {
  computeAreaLatLngs,
  computeLengthLatLngs,
  formatDistance,
  formatArea,
} from '@/lib/measurements';
import type { PmLayer } from '@/types/leaflet.types';

function flattenLatLngs(input: unknown): L.LatLng[] {
  if (!input) return [];
  if (!Array.isArray(input)) return [];
  if (input.length && Array.isArray(input[0]))
    return ([] as L.LatLng[]).concat(...(input as L.LatLng[][]));
  return input as L.LatLng[];
}

let lastMouseX = 0;
let lastMouseY = 0;
let hoverClearTimer: number | null = null;
let hoverActiveLayer: L.Layer | null = null;

const hoverAttached = new WeakMap<
  L.Layer,
  { onOver?: (e: L.LeafletMouseEvent) => void; onOut?: (e: L.LeafletMouseEvent) => void }
>();

function mouseMoveHandler(e: MouseEvent) {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

try {
  document.addEventListener('mousemove', mouseMoveHandler);
} catch {
  // ignore
}

export function attachHoverListeners(layer: L.Layer | null | undefined): void {
  if (!layer) return;
  const maybe = layer as L.Layer & {
    __hoverAttached?: boolean;
    eachLayer?: (fn: (l: L.Layer) => void) => void;
  };
  if (maybe.__hoverAttached) return;
  maybe.__hoverAttached = true;

  const owner = maybe;
  const onOver = (e?: L.LeafletMouseEvent) => {
    try {
      if (hoverClearTimer) {
        window.clearTimeout(hoverClearTimer);
        hoverClearTimer = null;
      }
      hoverActiveLayer = owner;

      const target = (e && (e.target as L.Layer)) ?? maybe;
      const l = target as PmLayer & L.Layer;
      if (!l) return;

      // Circles don't provide getLatLngs — handle them first
      if (l instanceof L.Circle) {
        measurementMode.value = 'area';
        const r = (l as L.Circle).getRadius();
        const area = Math.PI * r * r;
        measurementText.value = `${formatDistance(r)} • ${formatArea(area)}`;
        return;
      }

      if (typeof l.getLatLngs !== 'function') return;
      const ll = l.getLatLngs();
      const pts = flattenLatLngs(ll);
      if (l instanceof L.Polygon) {
        measurementMode.value = 'area';
        measurementText.value = formatArea(computeAreaLatLngs(pts));
      } else if (l instanceof L.Polyline) {
        measurementMode.value = 'distance';
        measurementText.value = formatDistance(computeLengthLatLngs(pts));
      }
    } catch {
      /* ignore */
    }
  };
  const onOut = () => {
    if (hoverClearTimer) window.clearTimeout(hoverClearTimer);
    const ownerLayer = maybe;
    hoverClearTimer = window.setTimeout(() => {
      try {
        if (hoverActiveLayer && hoverActiveLayer !== ownerLayer) return;

        const el = document.elementFromPoint(lastMouseX, lastMouseY) as HTMLElement | null;
        if (el) {
          let cur: HTMLElement | null = el;
          while (cur) {
            const cls = (cur.className || '') as string;
            if (
              cls.includes &&
              (cls.includes('leaflet-marker-icon') || cls.includes('leaflet-interactive'))
            ) {
              // still over a leaflet vector or marker — keep measurement
              return;
            }
            cur = cur.parentElement;
          }
        }
      } catch {
        // ignore and clear
      }
      hoverActiveLayer = null;
      measurementText.value = '';
      measurementMode.value = null;
      hoverClearTimer = null;
    }, 160);
  };

  try {
    const pmLayer = maybe as PmLayer;
    if (pmLayer.on) pmLayer.on('mouseover', onOver as (ev?: L.LeafletMouseEvent) => void);
    if (pmLayer.on) pmLayer.on('mouseout', onOut as (ev?: L.LeafletMouseEvent) => void);
  } catch {
    // ignore
  }

  if (typeof maybe.eachLayer === 'function') {
    try {
      maybe.eachLayer!((sub) => {
        try {
          const s = sub as L.Layer & { __hoverAttached?: boolean } & PmLayer;
          if (s.__hoverAttached) return;
          s.__hoverAttached = true;
          if (s.on) s.on('mouseover', onOver as (ev?: L.LeafletMouseEvent) => void);
          if (s.on) s.on('mouseout', onOut as (ev?: L.LeafletMouseEvent) => void);
          // register handlers for the sublayer so detachHoverListeners can remove them later
          hoverAttached.set(s, { onOver, onOut });
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
  }
  hoverAttached.set(maybe, { onOver, onOut });
}

export function detachHoverListeners(layer: L.Layer | null | undefined): void {
  if (!layer) return;
  const maybe = layer as L.Layer & {
    __hoverAttached?: boolean;
    eachLayer?: (fn: (l: L.Layer) => void) => void;
  } & PmLayer;
  const h = hoverAttached.get(maybe);
  if (h && maybe.off) {
    try {
      if (h.onOver && maybe.off)
        maybe.off('mouseover', h.onOver as (ev?: L.LeafletMouseEvent) => void);
      if (h.onOut && maybe.off)
        maybe.off('mouseout', h.onOut as (ev?: L.LeafletMouseEvent) => void);
    } catch {
      /* ignore */
    }
  }
  hoverAttached.delete(maybe);
  maybe.__hoverAttached = false;
  try {
    if (hoverActiveLayer === maybe) hoverActiveLayer = null;
    if (hoverClearTimer) {
      window.clearTimeout(hoverClearTimer);
      hoverClearTimer = null;
    }
  } catch {}
  if (typeof maybe.eachLayer === 'function') {
    try {
      maybe.eachLayer!((sub) => {
        try {
          const s = sub as L.Layer & { __hoverAttached?: boolean } & PmLayer;
          // remove any registered handlers for sublayers
          const hs = hoverAttached.get(s);
          if (hs && s.off) {
            try {
              if (hs.onOver) s.off('mouseover', hs.onOver as (ev?: L.LeafletMouseEvent) => void);
              if (hs.onOut) s.off('mouseout', hs.onOut as (ev?: L.LeafletMouseEvent) => void);
            } catch {
              /* ignore */
            }
          }
          hoverAttached.delete(s);
          (s as L.Layer & { __hoverAttached?: boolean }).__hoverAttached = false;
        } catch {}
      });
    } catch {}
  }
}

export function clearHoverState(): void {
  try {
    if (hoverClearTimer) {
      window.clearTimeout(hoverClearTimer);
      hoverClearTimer = null;
    }
    hoverActiveLayer = null;
    measurementText.value = '';
    measurementMode.value = null;
  } catch {
    /* ignore */
  }
}
