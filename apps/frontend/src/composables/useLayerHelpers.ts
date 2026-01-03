import L from 'leaflet';
import { generateDrawnId } from './usePersistDrawn';
import { attachHoverListeners } from './useHover';
import { attachContextDelete } from './useContextDelete';

export function markLayerAsUser(
  map: L.Map | undefined,
  l: L.Layer | null | undefined,
  id?: string | undefined,
): void {
  if (!l) return;
  try {
    const dl = l as L.Layer & {
      drawnId?: string;
      options?: Record<string, unknown>;
      pm?: { enable?: () => void };
    };
    dl.drawnId = id ?? dl.drawnId ?? generateDrawnId();
    dl.options = dl.options || {};
    (dl.options as Record<string, unknown>).pmIgnore = false;
    if (dl.pm && typeof dl.pm.enable === 'function') {
      try {
        dl.pm.enable();
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  try {
    if (map) attachContextDelete(map, l);
  } catch {
    /* ignore */
  }
  try {
    attachHoverListeners(l as L.Layer);
  } catch {
    /* ignore */
  }
}
