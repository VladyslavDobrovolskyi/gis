export type GeoPoint = { type: 'Point'; coordinates: [number, number] };
export type GeoPolygon =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

/**
 * Always returns array of rings: [ [ [lat, lng], ... ] ]
 */
export function getPolygonCoordsFromGeoJSON(geo: GeoPolygon | null): [number, number][][] {
  if (!geo) return [];

  const rings =
    geo.type === 'Polygon' ? geo.coordinates : (geo.coordinates as number[][][][]).flat();

  return rings.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
}

export function getPointCoordsFromGeoJSON(geo: GeoPoint | null): [number, number] | null {
  if (!geo) return null;
  return [geo.coordinates[1], geo.coordinates[0]];
}
