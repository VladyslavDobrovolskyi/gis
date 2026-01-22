import L from 'leaflet';

export function setPmIgnoreOnLayer(layer: L.Layer): void {
  try {
    const maybe = layer as L.Layer & {
      options?: Record<string, unknown>;
      pm?: { disable?: () => void } & Record<string, unknown>;
      // allow marking for user-drawn layers
      drawnId?: string | number;
    };
    maybe.options = maybe.options || {};
    (maybe.options as Record<string, unknown>).pmIgnore = true;
    if (maybe.pm && typeof maybe.pm.disable === 'function') {
      try {
        maybe.pm.disable();
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

export function disablePmOnAllLayers(map: L.Map): void {
  map.eachLayer((layer: L.Layer) => {
    try {
      if ((layer as { drawnId?: unknown }).drawnId) return;
      try {
        setPmIgnoreOnLayer(layer);
        (layer as L.Layer & { eachLayer?: (fn: (l: L.Layer) => void) => void }).eachLayer?.(
          (sub: L.Layer) => {
            if ((sub as { drawnId?: unknown }).drawnId) return;
            setPmIgnoreOnLayer(sub);
          },
        );
      } catch {
        /* ignore */
      }
    } catch {
      // ignore per-layer errors
    }
  });
}
