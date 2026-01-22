import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import * as allure from 'allure-js-commons';
import { createPinia, setActivePinia } from 'pinia';
import { useMapStore } from '@/stores/map.store';
import MeasurementBadge from '@/components/MeasurementBadge.vue';
import Loader from '@/components/Loader.vue';
import DeleteBubble from '@/components/DeleteBubble.vue';
import MarkerIcon from '@/components/MarkerIcon.vue';
import { createMarkerIcon } from '@/lib/marker';

/* ------------------------------------------------------------------
 * Mocks for asset-heavy / DOM-dependent libraries
 * ------------------------------------------------------------------ */
vi.mock('leaflet', () => {
  class MockIcon {
    constructor() {}
  }

  const api = {
    Icon: MockIcon,
    icon: () => new MockIcon(),
    map: () => ({}),
    tileLayer: () => ({}),
    marker: () => ({}),
    MarkerClusterGroup: class {},
  };

  return {
    default: api,
    ...api,
  };
});

vi.mock('leaflet.markercluster', () => ({}));
vi.mock('@geoman-io/leaflet-geoman-free', () => ({}));
vi.mock('@vue-leaflet/vue-leaflet', () => ({
  LMap: { template: '<div />' },
  LTileLayer: { template: '<div />' },
  LPolygon: { template: '<div />' },
}));

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */
function setupPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/* ------------------------------------------------------------------
 * Global hooks
 * ------------------------------------------------------------------ */
beforeAll(() => {
  allure.epic('Frontend Components');
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

/* ------------------------------------------------------------------
 * MeasurementBadge
 * ------------------------------------------------------------------ */
describe('Components: MeasurementBadge', () => {
  beforeAll(() => {
    allure.feature('MeasurementBadge');
  });

  it('Shows measurement text from store', () => {
    allure.severity('Normal');

    const pinia = setupPinia();
    const store = useMapStore();
    store.measurementText = '123 m';

    const wrapper = mount(MeasurementBadge, {
      global: { plugins: [pinia] },
    });

    expect(wrapper.text()).toContain('123 m');
  });

  it('Hides when no measurement text', () => {
    allure.severity('Normal');

    const pinia = setupPinia();
    const store = useMapStore();
    store.measurementText = '';

    const wrapper = mount(MeasurementBadge, {
      global: { plugins: [pinia] },
    });

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });
});

/* ------------------------------------------------------------------
 * Loader
 * ------------------------------------------------------------------ */
describe('Components: Loader', () => {
  beforeAll(() => {
    allure.feature('Loader');
  });

  it('Renders loader with role status', () => {
    allure.severity('Normal');

    const wrapper = mount(Loader);

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.find('.loader-spinner').exists()).toBe(true);
  });
});

/* ------------------------------------------------------------------
 * DeleteBubble
 * ------------------------------------------------------------------ */
describe('Components: DeleteBubble', () => {
  beforeAll(() => {
    allure.feature('DeleteBubble');
  });

  it('Shows bubble and dispatches event on confirm', async () => {
    allure.severity('Critical');

    const pinia = setupPinia();
    const store = useMapStore();

    store.deleteBubble.visible = true;
    store.deleteBubble.clientX = 100;
    store.deleteBubble.clientY = 200;
    store.deleteBubble.layer = { id: 'L1' };

    const wrapper = mount(DeleteBubble, {
      global: { plugins: [pinia] },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      window.addEventListener('map:delete-confirm', (e: Event) => resolve(e as CustomEvent), {
        once: true,
      });
    });

    await wrapper.find('.btn-bubble').trigger('click');

    const ev = await eventPromise;

    expect(ev.detail.layer).toEqual({ id: 'L1' });
    expect(store.deleteBubble.fading).toBe(true);
  });
});

/* ------------------------------------------------------------------
 * MarkerIcon & createMarkerIcon
 * ------------------------------------------------------------------ */
describe('Components: MarkerIcon & createMarkerIcon', () => {
  beforeAll(() => {
    allure.feature('MarkerIcon');
  });

  it('createMarkerIcon returns an object and MarkerIcon exposes it', () => {
    allure.severity('Normal');

    const icon = createMarkerIcon('green', 'small');
    expect(icon).toBeDefined();

    const wrapper = mount(MarkerIcon, {
      props: { color: 'green', size: 'small' },
    });

    const vm = wrapper.vm as unknown as {
      icon: ReturnType<typeof createMarkerIcon>;
    };

    expect(vm.icon).toBeDefined();
  });
});
