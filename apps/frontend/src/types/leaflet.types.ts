import type L from 'leaflet';

// Minimal typing to avoid `any` and centralize custom types used in the app
// Use the ambient MarkerClusterGroup interface from leaflet augmentation
export type MarkerClusterGroupLike = L.MarkerClusterGroup;

export interface DrawnLayer extends L.Layer {
  // stable id assigned to user-created / restored layers
  drawnId?: string;
  getLatLngs?: () => unknown;
}

// typed wrapper for PM-enabled layers to avoid using `any`
export interface PMAttachable {
  pm?: {
    // Geoman's `enable` may accept optional options in some versions
    enable?: (opts?: Record<string, unknown>) => void;
    disable?: () => void;
  };
}

// Combined typed alias for layers that are drawn and PM-attachable with optional options
export type DrawnPmLayer = DrawnLayer & PMAttachable & { options?: Record<string, unknown> };

export interface GeomanPM {
  // Public API
  setLang?(lang: string): void;
  addControls?(opts: {
    position?: string;
    drawMarker?: boolean;
    drawCircleMarker?: boolean;
    drawPolyline?: boolean;
    drawPolygon?: boolean;
    drawRectangle?: boolean;
    editMode?: boolean;
    dragMode?: boolean;
    removalMode?: boolean;
  }): void;
  disableDraw?(): void;
  disableGlobalEditMode?(): void;

  // Additional helpers used by some versions of leaflet-geoman (internal/optional)
  _layerAddedEdit?: (...args: unknown[]) => void;
  throttledReInitEdit?: unknown;
  _addedLayersEdit?: Record<string, unknown> | undefined;
  // Intentionally avoid an index signature here so external library types like PMLayerGroup remain compatible
}

export function isGeoman(pm: unknown): pm is GeomanPM {
  return (
    !!pm &&
    typeof pm === 'object' &&
    ('setLang' in pm || 'addControls' in pm || 'disableDraw' in pm || 'disableGlobalEditMode' in pm)
  );
}

export type PmLayer = L.Layer & {
  getLatLngs?: () => unknown;
  on?: (evt: string, fn: (...args: unknown[]) => void) => void;
  off?: (evt: string, fn?: (...args: unknown[]) => void) => void;
};

export interface LayerWithEach {
  eachLayer?: (fn: (l: L.Layer) => void) => void;
}
