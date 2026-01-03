import { lineString, polygon, length as turfLength, area as turfArea } from '@turf/turf';
import type { LatLng } from 'leaflet';

export function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}
export function formatArea(m2: number): string {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`;
  return `${Math.round(m2)} m²`;
}

export function computeLengthLatLngs(points: LatLng[]): number {
  if (points.length < 2) return 0;
  const coords = points.map((p) => [p.lng, p.lat] as [number, number]);
  const line = lineString(coords);
  return turfLength(line, { units: 'meters' }) as number;
}

export function computeAreaLatLngs(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const coords = points.map((p) => [p.lng, p.lat] as [number, number]);
  if (
    coords.length &&
    (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push(coords[0]);
  }
  const poly = polygon([coords]);
  return turfArea(poly) as number;
}

export function circleArea(radiusMeters: number): number {
  return Math.PI * radiusMeters * radiusMeters;
}
