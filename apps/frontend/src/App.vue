<template>
  <l-map ref="mapRef" :zoom="6" :center="[50.45, 30.52]" style="height: 100vh; width: 100%">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap contributors"
    />

    <!-- Countries -->
    <l-polygon
      v-for="country in countriesWithCoords"
      :key="'country-' + country.ogc_fid"
      :lat-lngs="country.coords"
      color="green"
      :fill-opacity="0.15"
    />

    <!-- Regions -->
    <l-polygon
      v-for="region in regionsWithCoords"
      :key="'region-' + region.ogc_fid"
      :lat-lngs="region.coords"
      color="orange"
      :fill-opacity="0.18"
    />

    <!-- City polygons -->
    <l-polygon
      v-for="(city, idx) in citiesWithPolygonCoords"
      :key="'city-' + (city.ogc_fid ?? idx)"
      :lat-lngs="city.geometry"
      color="blue"
      :fill-opacity="0.25"
    />
    <MeasurementBadge />
    <DeleteBubble />
  </l-map>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue';
import { LMap, LTileLayer, LPolygon } from '@vue-leaflet/vue-leaflet';
import { trpc } from './trpc';
import type { City } from '@gis/shared/schemas';
import L, { Polyline, Polygon, LeafletEvent } from 'leaflet';
import { useQuery } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import { useMapStore } from '@/stores/map.store';
import {
  computeLengthLatLngs,
  computeAreaLatLngs,
  formatDistance,
  formatArea,
} from '@/lib/measurements';
import { createMarkerIcon } from '@/lib/marker';
import MeasurementBadge from '@/components/MeasurementBadge.vue';
import DeleteBubble from '@/components/DeleteBubble.vue';

import {
  measurementMode,
  measurementText,
  onDrawVertex,
  startDrawMode,
  stopDrawMode,
  attachEditListeners,
  detachEditListeners,
} from '@/composables/useMeasurements';
import {
  attachHoverListeners,
  detachHoverListeners,
  clearHoverState,
} from '@/composables/useHover';
import { cancelDeleteBubble, deleteLayerImmediate } from '@/composables/useDelete';
import { generateDrawnId, persistAllDrawnLayers } from '@/composables/usePersistDrawn';

/* -------------------- Leaflet плагины -------------------- */

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

import type { GeoPoint, GeoPolygon } from '@/types/geo.types';
import type { Country, Region } from '@gis/shared/schemas';
import { getPolygonCoordsFromGeoJSON, getPointCoordsFromGeoJSON } from '@/composables/useGeo';
import type {
  DrawnLayer,
  DrawnPmLayer,
  PmLayer,
  LayerWithEach,
  GeomanPM,
  PMAttachable,
} from '@/types/leaflet.types';
import { isGeoman } from '@/types/leaflet.types';

// MarkerCluster usage: rely on ambient augmentation and check runtime availability instead of a separate factory helper

/* -------------------- Constants -------------------- */

// Use a reusable marker icon factory (color + size options)
const defaultMarkerIcon = createMarkerIcon('green', 'medium');

const mapRef = ref<InstanceType<typeof LMap> | null>(null);
let markerClusterGroup: L.MarkerClusterGroup | null = null;

// Pinia map store
const mapStore = useMapStore();

/* -------------------- Queries -------------------- */

const { data: citiesData } = useQuery<City[]>({
  queryKey: ['cities'],
  queryFn: () => trpc.cities.getCities.query(),
});

const { data: countriesData } = useQuery<Country[]>({
  queryKey: ['countries'],
  queryFn: () => trpc.countries.getCountries.query(),
});

const { data: regionsData } = useQuery<Region[]>({
  queryKey: ['regions'],
  queryFn: () => trpc.regions.getRegions.query(),
});

/* -------------------- Parsing -------------------- */

const cities = computed(() =>
  (citiesData.value ?? []).map((c) => ({
    ...c,
    parsedGeom: c.geom ? (JSON.parse(c.geom) as GeoPoint | GeoPolygon) : null,
  })),
);

const countries = computed(() =>
  (countriesData.value ?? []).map((c) => ({
    ...c,
    parsedGeom: c.geom ? (JSON.parse(c.geom) as GeoPolygon) : null,
  })),
);

const regions = computed(() =>
  (regionsData.value ?? []).map((r) => ({
    ...r,
    parsedGeom: r.geom ? (JSON.parse(r.geom) as GeoPolygon) : null,
  })),
);

/* -------------------- Geo helpers (moved to composable) -------------------- */

/* -------------------- Computed -------------------- */

const countriesWithCoords = computed(() =>
  countries.value
    .map((c) => ({
      ...c,
      coords: getPolygonCoordsFromGeoJSON(c.parsedGeom)[0] || [],
    }))
    .filter((c) => c.coords.length > 0),
);

const regionsWithCoords = computed(() =>
  regions.value
    .map((r) => ({
      ...r,
      coords: getPolygonCoordsFromGeoJSON(r.parsedGeom)[0] || [],
    }))
    .filter((r) => r.coords.length > 0),
);

const citiesWithCoords = computed(
  () =>
    cities.value
      .map((city) => ({
        ...city,
        coords:
          city.parsedGeom?.type === 'Point' ? getPointCoordsFromGeoJSON(city.parsedGeom) : null,
      }))
      .filter((city) => city.coords !== null) as (City & {
      coords: [number, number];
    })[],
);

const citiesWithPolygonCoords = computed(() =>
  cities.value
    .map((city) => ({
      ...city,
      geometry:
        city.parsedGeom?.type === 'Polygon' || city.parsedGeom?.type === 'MultiPolygon'
          ? getPolygonCoordsFromGeoJSON(city.parsedGeom)[0] || [][0] || []
          : [],
    }))
    .filter((city) => city.geometry.length > 0),
);

/* -------------------- Hover helpers (moved to composable) -------------------- */

const onEscapeKey = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  try {
    const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
    const pmLocal = (leafletMap as L.Map & { pm?: GeomanPM })?.pm;
    if (isGeoman(pmLocal)) {
      try {
        if (typeof pmLocal.disableDraw === 'function') pmLocal.disableDraw();
      } catch {}
      try {
        if (typeof pmLocal.disableGlobalEditMode === 'function') {
          try {
            const anyPm = pmLocal;
            if (
              typeof anyPm._layerAddedEdit === 'function' &&
              typeof anyPm.throttledReInitEdit === 'function'
            ) {
              try {
                pmLocal.disableGlobalEditMode();
              } catch {}
            } else {
              const mapL = mapRef.value?.leafletObject as L.Map | undefined;
              if (mapL) {
                try {
                  mapL.eachLayer((layer: L.Layer & PMAttachable) => {
                    try {
                      const lpm = layer.pm;
                      if (lpm && typeof lpm.disable === 'function') {
                        try {
                          lpm.disable();
                        } catch {}
                      }
                    } catch {}
                  });
                } catch {}
              }
            }
          } catch {}
        }
      } catch {}
    }
    if (leafletMap) {
      try {
        if (leafletMap.dragging && !leafletMap.dragging.enabled()) leafletMap.dragging.enable();
        if (leafletMap.scrollWheelZoom && typeof leafletMap.scrollWheelZoom.enable === 'function')
          leafletMap.scrollWheelZoom.enable();
        if (leafletMap.doubleClickZoom && typeof leafletMap.doubleClickZoom.enable === 'function')
          leafletMap.doubleClickZoom.enable();
        if (leafletMap.boxZoom && typeof leafletMap.boxZoom.enable === 'function')
          leafletMap.boxZoom.enable();
        if (leafletMap.keyboard && typeof leafletMap.keyboard.enable === 'function')
          leafletMap.keyboard.enable();
      } catch {
        /* ignore */
      }
    }
  } catch {
    // ignore
  }

  mapStore.activeTool = null;
  mapStore.globalEdit = false;
};
try {
  document.addEventListener('keydown', onEscapeKey);
} catch {
  /* ignore */
}

// remove on unmount
const onDeleteConfirm = (e: Event) => {
  try {
    const detail = (e as CustomEvent)?.detail as { layer?: L.Layer } | undefined;
    const layer = detail?.layer as L.Layer | undefined;
    const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
    if (layer && leafletMap) {
      try {
        deleteLayerImmediate(leafletMap, layer);
      } catch {
        /* ignore */
      }
    }
    cancelDeleteBubble();
  } catch {}
};
try {
  window.addEventListener('map:delete-confirm', onDeleteConfirm);
} catch {}
onBeforeUnmount(() => {
  try {
    document.removeEventListener('keydown', onEscapeKey);
  } catch {}
  try {
    window.removeEventListener('map:delete-confirm', onDeleteConfirm);
  } catch {}
});

// Hover and edit listener helpers moved to composables:
// - '@/composables/useHover' provides attachHoverListeners/detachHoverListeners
// - '@/composables/useMeasurements' provides attachEditListeners/detachEditListeners

// Delete bubble UI moved to composable: '@/composables/useDeleteBubble'
// delete behavior moved to composable: useDeleteBubble.deleteLayerImmediate(map, target, ...)
// see: '@/composables/useDeleteBubble'

/* -------------------- Map init -------------------- */

// draw persistence helpers have been moved to `composables/usePersistDrawn`
// using: `generateDrawnId` and `persistAllDrawnLayers(map)`

const initMap = useDebounceFn(async (): Promise<void> => {
  await nextTick();
  const leafletMap = mapRef.value?.leafletObject as L.Map | undefined;
  if (!leafletMap) return;

  const pm = (leafletMap as L.Map & { pm?: GeomanPM }).pm;

  // restore saved view if present
  if (mapStore.center && mapStore.zoom) {
    try {
      leafletMap.setView(mapStore.center as [number, number], mapStore.zoom);
    } catch {
      /* ignore invalid stored view */
    }
  }

  // draw persistence helpers moved to composable: usePersistDrawn
  // use `generateDrawnId` and `persistAllDrawnLayers(map)` from '@/composables/usePersistDrawn'

  // Attach right-click-to-delete handler to a layer or its sublayers

  // Attach right-click-to-delete handler to a layer or its sublayers
  function attachContextDelete(layer: L.Layer | null | undefined): void {
    if (!layer) return;
    const maybe = layer as L.Layer & {
      on?: (evName: string, handler: (ev?: L.LeafletEvent) => void) => void;
      off?: (evName: string, handler?: (ev?: L.LeafletEvent) => void) => void;
      eachLayer?: (fn: (l: L.Layer) => void) => void;
      options?: Record<string, unknown>;
      // marker to avoid double-attaching
      __contextDeleteAttached?: boolean;
    };

    if (maybe.__contextDeleteAttached) return;
    maybe.__contextDeleteAttached = true;

    const handler = (ev?: L.LeafletMouseEvent) => {
      try {
        // determine clicked layer (ev.target if available), otherwise fallback to maybe
        const clickedLayer = ev?.target as L.Layer | undefined;
        const targetLayer = clickedLayer ?? maybe;

        // ensure we only delete user-created layers (they have drawnId)
        const tl = targetLayer as LayerWithEach & DrawnLayer;
        const isGroupLocal = typeof (tl as LayerWithEach).eachLayer === 'function';
        const isUserLayer =
          Boolean((tl as DrawnLayer).drawnId) ||
          (isGroupLocal &&
            (() => {
              let found = false;
              try {
                (tl as LayerWithEach).eachLayer!((sub: L.Layer) => {
                  if ((sub as DrawnLayer).drawnId) found = true;
                });
              } catch {
                /* ignore */
              }
              return found;
            })());
        if (!isUserLayer) return;

        // prevent default browser menu
        ev?.originalEvent?.preventDefault?.();
        ev?.originalEvent?.stopPropagation?.();

        // debug: report that the contextmenu handler fired
        try {
          console.debug('attachContextDelete:contextmenu', {
            isGroup: isGroupLocal,
            layer: tl,
            ev,
          });
        } catch {}

        // immediate-delete on right-click, then show bubble as visual feedback
        try {
          deleteLayerImmediate(leafletMap, tl as L.Layer, isGroupLocal, ev);
        } catch (err) {
          console.warn('deleteLayerImmediate failed', err);
        }
      } catch (err) {
        console.warn('attachContextDelete handler failed', err);
      }
    };

    if (maybe.on) {
      try {
        maybe.on('contextmenu', handler);
      } catch {
        // ignore
      }
    }

    // also attach to sublayers for groups
    if (typeof maybe.eachLayer === 'function') {
      try {
        maybe.eachLayer!((sub: L.Layer) => {
          const s = sub as L.Layer & {
            __contextDeleteAttached?: boolean;
            on?: (ev: string, handler: (ev?: L.LeafletEvent) => void) => void;
          };
          if (s.__contextDeleteAttached) return;
          s.__contextDeleteAttached = true;
          if (s.on) s.on('contextmenu', handler);
        });
      } catch {
        /* ignore */
      }
    }
  }

  // restore drawn features from store
  if (mapStore.drawn?.features?.length) {
    L.geoJSON(mapStore.drawn, {
      onEachFeature(_feature, layer: L.Layer) {
        try {
          layer.addTo(leafletMap);
          const idFromFeature = (_feature &&
            (_feature.id ||
              (_feature.properties && (_feature.properties as Record<string, unknown>).__id))) as
            | string
            | undefined;
          if (
            'eachLayer' in layer &&
            typeof (layer as L.Layer & { eachLayer?: (fn: (l: L.Layer) => void) => void })
              .eachLayer === 'function'
          ) {
            (layer as L.Layer & { eachLayer?: (fn: (l: L.Layer) => void) => void }).eachLayer!(
              (sub: L.Layer) => {
                const s = sub as DrawnPmLayer;
                s.drawnId = idFromFeature ?? s.drawnId ?? generateDrawnId();
                s.options = s.options || {};
                (s.options as Record<string, unknown>).pmIgnore = false;
                if (s.pm && typeof s.pm.enable === 'function') {
                  try {
                    s.pm.enable();
                  } catch {
                    /* ignore */
                  }
                }
                // attach right-click-to-delete handler to restored sublayer
                attachContextDelete(sub);
                // show measurements on hover
                attachHoverListeners(sub);
              },
            );
          } else {
            const drawnLayer = layer as DrawnPmLayer;
            drawnLayer.drawnId = idFromFeature ?? drawnLayer.drawnId ?? generateDrawnId();
            drawnLayer.options = drawnLayer.options || {};
            (drawnLayer.options as Record<string, unknown>).pmIgnore = false;
            if (drawnLayer.pm && typeof drawnLayer.pm.enable === 'function') {
              try {
                drawnLayer.pm.enable();
              } catch {
                /* ignore */
              }
            }
            // attach right-click-to-delete handler to restored layer
            attachContextDelete(layer);
            // show measurements on hover
            attachHoverListeners(layer);
          }
        } catch {
          // ignore
        }
      },
    }).addTo(leafletMap);
  }

  // Prevent Geoman (PM) from interacting with preloaded layers (countries, regions, cities)
  function disablePmOnAllLayers(map: L.Map): void {
    map.eachLayer((layer: L.Layer) => {
      try {
        // skip user-drawn layers (they have `drawnId` set)
        if ((layer as DrawnLayer).drawnId) return;

        type LayerWithPm = L.Layer & {
          options?: Record<string, unknown>;
          pm?: { disable?: () => void } & Record<string, unknown>;
          eachLayer?: (fn: (l: L.Layer) => void) => void;
        };
        const maybe = layer as LayerWithPm;

        maybe.options = maybe.options || {};
        (maybe.options as Record<string, unknown>).pmIgnore = true;
        if (maybe.pm && typeof maybe.pm.disable === 'function') {
          try {
            maybe.pm.disable();
          } catch {
            /* ignore */
          }
        }

        // if the layer is a group (e.g., geoJSON group), apply to sublayers as well
        if (typeof maybe.eachLayer === 'function') {
          try {
            maybe.eachLayer!((sub: L.Layer) => {
              if ((sub as DrawnLayer).drawnId) return;
              type SubWithPm = L.Layer & {
                options?: Record<string, unknown>;
                pm?: { disable?: () => void };
              };
              const ms = sub as SubWithPm;
              ms.options = ms.options || {};
              (ms.options as Record<string, unknown>).pmIgnore = true;
              if (ms.pm && typeof ms.pm.disable === 'function') {
                try {
                  ms.pm.disable();
                } catch {
                  /* ignore */
                }
              }
            });
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore per-layer errors
      }
    });
  }

  // run once to protect preloaded layers
  disablePmOnAllLayers(leafletMap);

  // persist view on move end
  leafletMap.on('moveend', () => {
    const c = leafletMap.getCenter();
    mapStore.center = [c.lat, c.lng];
    mapStore.zoom = leafletMap.getZoom();
  });

  // Geoman initialization
  if (isGeoman(pm)) {
    if (typeof pm.setLang === 'function') pm.setLang('en');
    if (typeof pm.addControls === 'function')
      pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: true,
        drawPolygon: true,
        drawRectangle: true,
        editMode: true,
        dragMode: true,
        removalMode: true,
      });

    // Remove/hide rotate control — Geoman may add a rotate button in the actions container.
    // We hide it with CSS (see style below) and also remove it from DOM after controls are created.
    try {
      const removeRotateControls = () => {
        const toolbar =
          document.querySelector('.leaflet-pm-toolbar') ||
          document.querySelector('.leaflet-buttons');
        if (!toolbar) return;

        // remove rotate icon elements and their containers
        toolbar
          .querySelectorAll('.leaflet-pm-icon-rotate, .control-icon.leaflet-pm-icon-rotate')
          .forEach((el) => {
            const container =
              (el as HTMLElement).closest('.button-container') || (el as HTMLElement).parentElement;
            if (container) container.remove();
            else (el as HTMLElement).remove();
          });

        // Also remove eraser / removal controls (best-effort): look for common icon classes and titles
        toolbar
          .querySelectorAll(
            '.leaflet-pm-icon-remove, .leaflet-pm-icon-delete, .leaflet-pm-icon-trash, .leaflet-pm-icon-removal, .control-icon.leaflet-pm-icon-remove',
          )
          .forEach((el) => {
            const container =
              (el as HTMLElement).closest('.button-container') || (el as HTMLElement).parentElement;
            if (container) container.remove();
            else (el as HTMLElement).remove();
          });

        // remove any button containers whose title contains rotate or delete keywords (case-insensitive)
        toolbar.querySelectorAll('.button-container').forEach((el) => {
          try {
            const title = (el as HTMLElement).getAttribute('title') || '';
            const t = title.toLowerCase();
            if (
              t.includes('поворот') ||
              t.includes('удал') ||
              t.includes('удалить') ||
              t.includes('remove') ||
              t.includes('delete') ||
              t.includes('trash')
            )
              (el as HTMLElement).remove();
          } catch {}
        });

        // remove individual actions with rotate/delete titles
        toolbar.querySelectorAll('.leaflet-pm-action').forEach((el) => {
          try {
            const title = (el as HTMLElement).getAttribute('title') || '';
            const t = title.toLowerCase();
            if (
              t.includes('поворот') ||
              t.includes('удал') ||
              t.includes('delete') ||
              t.includes('remove') ||
              t.includes('trash')
            )
              (el as HTMLElement).remove();
          } catch {}
        });
      };
      // call once after a short delay to let Geoman render its toolbar
      setTimeout(removeRotateControls, 200);
      // and observe toolbar for future changes
      const toolbarNode =
        document.querySelector('.leaflet-pm-toolbar') || document.querySelector('.leaflet-buttons');
      if (toolbarNode && typeof MutationObserver !== 'undefined') {
        const obs = new MutationObserver(removeRotateControls);
        obs.observe(toolbarNode, { childList: true, subtree: true });
      }
    } catch {
      // ignore failures — this is best-effort
    }
  }

  // Toggle map interactions to avoid input conflicts when Geoman tools are active
  function setMapInteractivity(enabled: boolean) {
    const map = leafletMap;
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

  // Geoman events: disable map interactions while drawing or editing
  leafletMap.on('pm:drawstart', () => setMapInteractivity(false));
  leafletMap.on('pm:drawend', () => setMapInteractivity(true));
  leafletMap.on('pm:editstart', () => setMapInteractivity(false));
  leafletMap.on('pm:editend', () => setMapInteractivity(true));
  leafletMap.on('pm:globaleditmodetoggled', (e: { enabled?: boolean }) =>
    setMapInteractivity(!Boolean(e?.enabled)),
  );
  leafletMap.on('pm:dragstart', () => setMapInteractivity(false));
  leafletMap.on('pm:dragend', () => setMapInteractivity(true));

  leafletMap.on('pm:create', (e: { layer: L.Layer; shape?: string }) => {
    const layer = e.layer as DrawnLayer | Polyline | Polygon;
    const getLatLngs = (layer as DrawnLayer).getLatLngs;
    if (import.meta.env.DEV) {
      console.debug(
        'Создано:',
        e.shape,
        typeof getLatLngs === 'function' ? getLatLngs.call(layer) : undefined,
      );
    }
    const dl = layer as DrawnPmLayer;
    dl.drawnId = dl.drawnId ?? generateDrawnId();
    dl.options = dl.options || {};
    (dl.options as Record<string, unknown>).pmIgnore = false;
    if (dl.pm && typeof dl.pm.enable === 'function') {
      try {
        dl.pm.enable();
      } catch {
        /* ignore */
      }
    }
    // attach right-click-to-delete handler
    attachContextDelete(layer as L.Layer);
    // attach hover listeners to show measurements
    attachHoverListeners(layer as L.Layer);
    persistAllDrawnLayers(leafletMap);
  });

  // Right-click cancels active Geoman tool (draw/edit) and re-enables map interactivity
  leafletMap.on('contextmenu', () => {
    try {
      if (isGeoman(pm)) {
        try {
          if (typeof pm.disableDraw === 'function') pm.disableDraw();
        } catch {}
        if (typeof pm.disableGlobalEditMode === 'function') {
          try {
            const anyPm = pm;
            // Guard against broken Geoman internals that may not have set up handlers
            if (
              typeof anyPm._layerAddedEdit === 'function' &&
              typeof anyPm.throttledReInitEdit === 'function'
            ) {
              try {
                pm.disableGlobalEditMode();
              } catch {
                /* ignore geoman listener errors */
              }
            } else {
              // Fallback: disable PM on all layers (safer than calling disableGlobalEditMode when internals are missing)
              try {
                disablePmOnAllLayers(leafletMap);
              } catch {
                /* ignore */
              }
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      // ignore
    }
    mapStore.activeTool = null;
    mapStore.globalEdit = false;
    setMapInteractivity(true);
    // do not automatically cancel the delete bubble here — allow layer-level handlers to show it
  });

  // hide bubble on common map interactions
  leafletMap.on('move', cancelDeleteBubble);
  leafletMap.on('zoom', cancelDeleteBubble);
  leafletMap.on('pm:drawstart', cancelDeleteBubble);
  leafletMap.on('pm:create', cancelDeleteBubble);

  // Measurement wiring: call top-level helper functions that manage measurements
  const mapEvents = leafletMap as L.Map;
  // typed Geoman event: layer is a Leaflet layer (possibly PM-attached)
  type GeomanEvent = LeafletEvent & {
    shape?: string;
    layer?: L.Layer | undefined;
    latlng?: L.LatLng;
  };

  // Attach measurement update listeners when edit starts
  mapEvents.on('pm:editstart', (e: GeomanEvent) => {
    const layer = e?.layer as PmLayer | undefined;
    if (layer) attachEditListeners(layer);
    setMapInteractivity(false);
  });

  mapEvents.on('pm:drawstart', (e: GeomanEvent) => {
    const shape = (e?.shape as string) ?? '';
    startDrawMode(leafletMap, shape);
    setMapInteractivity(false);
  });
  mapEvents.on('pm:drawvertex', (e: GeomanEvent) => onDrawVertex(e));
  mapEvents.on('pm:drawend', () => {
    stopDrawMode(leafletMap);
    setMapInteractivity(true);
  });
  mapEvents.on('pm:create', (e: GeomanEvent) => {
    stopDrawMode(leafletMap);
    try {
      const layer = e.layer as PmLayer & DrawnLayer;

      // Circles don't expose getLatLngs; handle them explicitly
      if (layer && layer instanceof L.Circle) {
        measurementMode.value = 'area';
        try {
          const r = (layer as L.Circle).getRadius();
          const area = Math.PI * r * r;
          measurementText.value = `${formatDistance(r)} • ${formatArea(area)}`;
        } catch {
          /* ignore */
        }

        const dl2 = layer as L.Circle & DrawnPmLayer;
        dl2.drawnId = dl2.drawnId ?? generateDrawnId();
        dl2.options = dl2.options || {};
        (dl2.options as Record<string, unknown>).pmIgnore = false;
        if (dl2.pm && typeof dl2.pm.enable === 'function') {
          try {
            dl2.pm.enable();
          } catch {
            /* ignore */
          }
        }
        // attach right-click delete and hover measurement handlers for newly created circles
        try {
          attachContextDelete(layer);
        } catch {}
        try {
          attachHoverListeners(layer);
        } catch {}

        setTimeout(() => (measurementText.value = ''), 3000);
        persistAllDrawnLayers(leafletMap);

        // done
        setMapInteractivity(true);
        return;
      }

      if (layer && typeof layer.getLatLngs === 'function') {
        const ll = layer.getLatLngs();
        const nested = Array.isArray(ll) ? (ll as L.LatLng[][]) : ([] as L.LatLng[][]);
        const pts: L.LatLng[] = ([] as L.LatLng[]).concat(...nested);
        if (layer instanceof L.Polygon) {
          measurementMode.value = 'area';
          measurementText.value = formatArea(computeAreaLatLngs(pts));
        } else if (layer instanceof L.Polyline) {
          measurementMode.value = 'distance';
          measurementText.value = formatDistance(computeLengthLatLngs(pts));
        }
        setTimeout(() => (measurementText.value = ''), 3000);
        const dl2 = layer as DrawnPmLayer;
        dl2.drawnId = dl2.drawnId ?? generateDrawnId();
        dl2.options = dl2.options || {};
        (dl2.options as Record<string, unknown>).pmIgnore = false;
        if (dl2.pm && typeof dl2.pm.enable === 'function') {
          try {
            dl2.pm.enable();
          } catch {
            /* ignore */
          }
        }
        // attach right-click delete and hover measurement handlers for newly created layer
        try {
          attachContextDelete(layer);
        } catch {}
        try {
          attachHoverListeners(layer);
        } catch {}
        persistAllDrawnLayers(leafletMap);
      }
    } catch {
      // ignore
    }
    setMapInteractivity(true);
  });
  // persist after edits/removals are already wired later

  // When a layer is cut (scissors), Geoman may produce new layers or sublayers.
  // Ensure newly created pieces are user-managed: assign stable ids, re-enable PM,
  // attach contextmenu delete and hover measurement handlers, and persist state.
  mapEvents.on('pm:cut', (e: GeomanEvent) => {
    try {
      const maybe = e as { layer?: L.Layer; layers?: L.Layer[] };
      function processLayer(l: L.Layer | null | undefined) {
        if (!l) return;
        try {
          // mark as user-drawn, enable PM where available
          const dp = l as DrawnPmLayer;
          dp.drawnId = dp.drawnId ?? generateDrawnId();
          dp.options = dp.options || {};
          (dp.options as Record<string, unknown>).pmIgnore = false;
          if (dp.pm && typeof dp.pm.enable === 'function') {
            try {
              dp.pm.enable();
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
        try {
          attachContextDelete(l);
        } catch {}
        try {
          attachHoverListeners(l);
        } catch {}
      }

      if (maybe.layer) {
        const l = maybe.layer;
        if (
          (l as LayerWithEach).eachLayer &&
          typeof (l as LayerWithEach).eachLayer === 'function'
        ) {
          try {
            (l as LayerWithEach).eachLayer!((sub: L.Layer) => processLayer(sub));
          } catch {}
        } else {
          processLayer(l);
        }
      }

      if (maybe.layers && Array.isArray(maybe.layers)) {
        try {
          (maybe.layers as L.Layer[]).forEach((ll) => processLayer(ll));
        } catch {}
      }

      persistAllDrawnLayers(leafletMap);
    } catch {
      /* ignore */
    }
  });
  mapEvents.on('pm:editend', (e: GeomanEvent) => {
    const layer = e?.layer as PmLayer | undefined;
    if (layer) detachEditListeners(layer);
    measurementText.value = '';
    // persist after edits
    persistAllDrawnLayers(leafletMap);
    setMapInteractivity(true);
  });
  leafletMap.on('pm:remove', (e: { layer?: L.Layer }) => {
    try {
      if (e?.layer) {
        try {
          detachHoverListeners(e.layer);
        } catch {}
        try {
          clearHoverState();
        } catch {}
      }
    } catch {}
    persistAllDrawnLayers(leafletMap);
  });

  // Marker clustering (without ambient augmentation)
  if (citiesWithCoords.value && citiesWithCoords.value.length && mapRef.value) {
    const leafletMap = mapRef.value.leafletObject as L.Map;

    // Remove old cluster group if present
    if (markerClusterGroup) {
      try {
        if (leafletMap) leafletMap.removeLayer(markerClusterGroup);
      } catch {
        /* ignore */
      }
      markerClusterGroup = null;
    }

    // Try to create a new cluster group using factory or constructor
    let cluster: L.LayerGroup | null = null;
    const maybeFactory = (L as { markerClusterGroup?: () => L.LayerGroup }).markerClusterGroup;
    const maybeCtor = (L as { MarkerClusterGroup?: new () => L.LayerGroup }).MarkerClusterGroup;

    if (typeof maybeFactory === 'function') {
      cluster = maybeFactory();
    } else if (typeof maybeCtor === 'function') {
      cluster = new maybeCtor();
    }

    if (cluster) {
      markerClusterGroup = cluster as L.MarkerClusterGroup;

      for (const city of citiesWithCoords.value) {
        // Explicitly type coords as [number, number]
        const marker = L.marker(city.coords as [number, number], {
          icon: defaultMarkerIcon,
        });
        marker.bindPopup(`<strong>${city.city_name}</strong>`);
        markerClusterGroup.addLayer(marker);
      }

      if (leafletMap) {
        leafletMap.addLayer(markerClusterGroup);
      }

      // ensure marker clusters and their markers are ignored by Geoman
      try {
        disablePmOnAllLayers(leafletMap);
      } catch {}
    }
  }
}, 150);
watch([citiesWithCoords, countriesWithCoords, regionsWithCoords], () => initMap());
</script>
