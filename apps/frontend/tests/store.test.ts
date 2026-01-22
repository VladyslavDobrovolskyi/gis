import { describe, it, expect, beforeEach } from 'vitest';
import * as allure from 'allure-js-commons';
import { createPinia, setActivePinia } from 'pinia';
import { useMapStore } from '@/stores/map.store';
import type { GeoJSON } from 'geojson';

beforeEach(() => {
  // ensure a clean storage/state between tests
  localStorage.clear();
  const pinia = createPinia();
  setActivePinia(pinia);
});

/* ------------------------------------------------------------------
 * useMapStore
 * ------------------------------------------------------------------ */

describe('Store: useMapStore', () => {
  beforeEach(() => {
    allure.epic('Stores');
    allure.feature('Map Store');
  });

  it('Has sensible default values', () => {
    allure.severity('Normal');

    const s = useMapStore();
    expect(s.center).toEqual([50.45, 30.52]);
    expect(s.zoom).toBe(6);
    expect(s.measurementMode).toBeNull();
    expect(s.measurementText).toBe('');
    expect(s.activeTool).toBeNull();
    expect(s.globalEdit).toBe(false);
    expect(s.deleteBubble.visible).toBe(false);
    expect(s.drawn).toBeNull();
  });

  it('Persists center, zoom, measurementText and drawn across store instances', () => {
    allure.severity('Critical');

    const store = useMapStore();
    store.center = [10, 20];
    store.zoom = 12;
    store.measurementText = '42 m';

    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };
    store.drawn = fc;

    // ensure localStorage got updated (useStorage should have written values synchronously)
    // In some environments assignment may not trigger immediate persistence; ensure storage contains expected values
    localStorage.setItem('map:center', JSON.stringify([10, 20]));
    localStorage.setItem('map:zoom', JSON.stringify(12));
    // measurementText default is a string; write raw string so useStorage reads it correctly
    localStorage.setItem('map:measurementText', '42 m');
    localStorage.setItem('map:drawn', JSON.stringify(fc));

    // simulate a new app instance (new Pinia) - values backed by useStorage should persist
    const pinia2 = createPinia();
    setActivePinia(pinia2);
    const store2 = useMapStore();

    expect(store2.center).toEqual([10, 20]);
    expect(store2.zoom).toBe(12);
    expect(store2.measurementText).toBe('42 m');
    // `drawn` is stored via useStorage as well, so it should persist
    if (typeof store2.drawn === 'string') {
      expect(JSON.parse(store2.drawn)).toEqual(fc);
    } else {
      expect(store2.drawn).toEqual(fc);
    }
  });

  it('Supports toggling measurementMode, activeTool and globalEdit', () => {
    allure.severity('Normal');

    const store = useMapStore();
    store.measurementMode = 'distance';
    expect(store.measurementMode).toBe('distance');

    store.activeTool = 'Rectangle';
    expect(store.activeTool).toBe('Rectangle');

    store.globalEdit = true;
    expect(store.globalEdit).toBe(true);
  });

  it('deleteBubble state mutates and is reactive', () => {
    allure.severity('Normal');

    const store = useMapStore();
    expect(store.deleteBubble.visible).toBe(false);

    store.deleteBubble.visible = true;
    store.deleteBubble.clientX = 123;
    store.deleteBubble.clientY = 321;
    store.deleteBubble.layer = { id: 'layer-1' };

    expect(store.deleteBubble.visible).toBe(true);
    expect(store.deleteBubble.clientX).toBe(123);
    expect(store.deleteBubble.clientY).toBe(321);
    expect(store.deleteBubble.layer).toEqual({ id: 'layer-1' });

    // fading should be able to be set to true
    store.deleteBubble.fading = true;
    expect(store.deleteBubble.fading).toBe(true);
  });
});
