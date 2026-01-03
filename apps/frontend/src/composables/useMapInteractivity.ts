import L from 'leaflet';

export function setMapInteractivity(map: L.Map, enabled: boolean): void {
  if (!map) return;
  try {
    if (enabled) {
      if (!map.dragging.enabled()) map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      if (map.boxZoom) map.boxZoom.enable();
      if (map.keyboard) map.keyboard.enable();
    } else {
      if (map.dragging.enabled()) map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      if (map.boxZoom) map.boxZoom.disable();
      if (map.keyboard) map.keyboard.disable();
    }
  } catch (err) {
    // ignore: some builds may not expose every control
    console.warn('setMapInteractivity failed', err);
  }
}
