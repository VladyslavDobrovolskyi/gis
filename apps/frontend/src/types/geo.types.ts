export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export type GeoPolygon =
  | {
      type: 'Polygon';
      coordinates: [number, number][][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: [number, number][][][];
    };
