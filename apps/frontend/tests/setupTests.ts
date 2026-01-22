import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Suppress specific Vue warnings
config.global.config.warnHandler = (msg, ...args) => {
  if (typeof msg === 'string' && msg.includes('Component is missing template or render function')) {
    // Suppress only this specific warning
    return;
  }
  // Let all other warnings pass through
  console.warn(msg, ...args);
};

// Centralized lightweight Leaflet and related mocks used across frontend tests
vi.mock('leaflet', () => {
  class MockIcon {
    constructor() {}
  }
  const defaultExport = {
    Icon: MockIcon,
    icon: () => new MockIcon(),
    map: () => ({}),
    tileLayer: () => ({}),
    marker: () => ({}),
    MarkerClusterGroup: class {},
  };
  return {
    default: defaultExport,
    Icon: MockIcon,
    icon: () => new MockIcon(),
    map: () => ({}),
    tileLayer: () => ({}),
    marker: () => ({}),
    MarkerClusterGroup: class {},
  };
});
vi.mock('leaflet.markercluster', () => ({}));
vi.mock('@geoman-io/leaflet-geoman-free', () => ({}));
vi.mock('@vue-leaflet/vue-leaflet', () => ({ LMap: {}, LTileLayer: {}, LPolygon: {} }));
