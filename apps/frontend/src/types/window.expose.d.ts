interface Window {
  __MAP__?: import('leaflet').Map;
  __MAP_STORE__?: import('@/stores/mapStore').MapStore;

  __LAYERS__?: {
    drawnItems?: LayerGroupLike;
    cityMarkers?: LayerGroupLike | null;
    cityBorders?: LayerGroupLike | null;
    countryBorders?: LayerGroupLike | null;
    regionBorders?: LayerGroupLike | null;
  };
  __DATA__?: {
    citiesWithCoords?: unknown[];
    citiesWithPolygonCoords?: unknown[];
    countriesWithCoords?: unknown[];
    regionsWithCoords?: unknown[];
  };
  __GEOMAN__?: unknown;
  L?: typeof import('leaflet');
  __TEST_LOGS__?: string[];
}
