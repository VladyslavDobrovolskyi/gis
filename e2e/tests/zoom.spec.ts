import { test, expect, type Page } from '@playwright/test';
import { MainPage } from '@/pageobjects/MainPage';
import * as allure from 'allure-js-commons';

/* Map zoom tests — verify that zoom-in and zoom-out controls adjust map zoom level */

const timeout = 30000;

test.describe('App E2E - Map Zooming', () => {
  test.beforeEach(() => {
    allure.epic('Navigation');
    allure.feature('Zooming');
    allure.story('Map zoom controls');
    allure.tag('e2e');
    allure.severity(allure.Severity.NORMAL);
  });

  test('User can zoom in and out', async ({ page }: { page: Page }) => {
    const main = new MainPage(page);

    await test.step('Open app and ensure map visible', async () => {
      await main.goto();
      await main.expectMapVisible();
    });

    /* Read initial zoom level from the exposed window.__MAP__ (wait for it to be ready) */
    await page.waitForFunction(
      () => {
        const m = (window as Window).__MAP__;
        return !!(m && typeof m.getZoom === 'function');
      },
      { timeout },
    );

    const initialZoom = await page.evaluate<number | null>(() => {
      const m = (window as Window).__MAP__;
      return m && typeof m.getZoom === 'function' ? m.getZoom() : null;
    });

    if (initialZoom === null) throw new Error('Could not determine initial map zoom level');

    await test.step('Zoom in increases the zoom level', async () => {
      await main.clickZoomIn();
      await page.waitForFunction(
        (z: number) => {
          const m = (window as any).__MAP__;
          return !!(m && typeof m.getZoom === 'function' && m.getZoom() > z);
        },
        initialZoom,
        { timeout, polling: 500 },
      );

      const afterZoom = await page.evaluate<number | null>(() => {
        return (window as Window).__MAP__?.getZoom?.() ?? null;
      });

      expect(typeof afterZoom).toBe('number');
      if (afterZoom === null) throw new Error('Zoom after zoom-in is not available');
      expect(afterZoom).toBeGreaterThan(initialZoom);
    });

    await test.step('Zoom out decreases the zoom level', async () => {
      const beforeOutZoom = await page.evaluate<number | null>(() => {
        return (window as Window).__MAP__?.getZoom?.() ?? null;
      });
      if (beforeOutZoom === null) throw new Error('Zoom before zoom-out is not available');

      await main.clickZoomOut();
      await page.waitForFunction(
        (z: number) => {
          const m = (window as any).__MAP__;
          return !!(m && typeof m.getZoom === 'function' && m.getZoom() < z);
        },
        beforeOutZoom,
        { timeout, polling: 500 },
      );

      const finalZoom = await page.evaluate<number | null>(() => {
        return (window as Window).__MAP__?.getZoom?.() ?? null;
      });

      expect(typeof finalZoom).toBe('number');
      if (finalZoom === null) throw new Error('Zoom after zoom-out is not available');
      expect(finalZoom).toBeLessThan(beforeOutZoom);
    });
  });
});
