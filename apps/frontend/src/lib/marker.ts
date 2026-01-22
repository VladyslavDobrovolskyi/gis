import L from 'leaflet';

export type MarkerSize = 'small' | 'medium' | 'large';

const SIZE_MAP: Record<MarkerSize, [number, number]> = {
  small: [18, 30],
  medium: [25, 41],
  large: [36, 58],
};

const SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png';

export function createMarkerIcon(color = 'green', size: MarkerSize = 'medium') {
  const iconSize = SIZE_MAP[size] || SIZE_MAP['medium'];
  const colorSafe = String(color || 'green')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const iconUrl =
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' +
    colorSafe +
    '.png';
  return new L.Icon({
    iconUrl,
    shadowUrl: SHADOW_URL,
    iconSize,
    iconAnchor: [Math.round(iconSize[0] / 2), iconSize[1]],
    popupAnchor: [1, -Math.round(iconSize[1] / 3)],
    shadowSize: [41, 41],
  });
}

export default createMarkerIcon;
