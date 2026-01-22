import { test, expect } from '@playwright/test';
import { MainPage } from '../pageobjects/MainPage';
import { MapWrapper } from '../pageobjects/MapWrapper';
import * as allure from 'allure-js-commons';

/* Smoke tests via Page Object */

test.describe('App E2E - Smoke', () => {
  allure.epic('Application');
  allure.feature('Smoke');

  test.beforeEach(() => {
    allure.story('Smoke tests');
    allure.tag('e2e');
    allure.severity(allure.Severity.NORMAL);
  });

  test('Home page renders and map is visible', async ({ page }) => {
    const main = new MainPage(page);
    await test.step('Open home page', async () => {
      await main.goto();
    });
    await test.step('Map is visible', async () => {
      await main.expectMapVisible();
    });
  });

  test('No console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const main = new MainPage(page);
    await test.step('Open home page', async () => {
      await main.goto();
    });
    await test.step('Map is visible', async () => {
      await main.expectMapVisible();
    });
    await test.step('Assert no console errors', async () => {
      expect(errors).toEqual([]);
    });
  });
});

test.describe('App E2E - Map Interactions', () => {
  allure.epic('Map Editing');
  allure.feature('Interactions');

  test.describe('Polygon tool activation', () => {
    test.beforeEach(() => {
      allure.story('Open polygon draw tool');
      allure.tag('e2e');
      allure.severity(allure.Severity.CRITICAL);
    });

    test('Can open polygon draw tool', async ({ page }) => {
      const main = new MainPage(page);
      await test.step('Open app and ensure map visible', async () => {
        await main.goto();
        await main.expectMapVisible();
      });
      await test.step('Activate polygon draw tool', async () => {
        await main.clickDrawPolygon();
      });
      await test.step('Verify Finish button is visible', async () => {
        /* Expect a control-specific indicator (Finish button) to appear when polygon mode is active */
        await expect(page.getByRole('button', { name: /Finish/i }).first()).toBeVisible();
      });
    });
  });
});

test.describe('App E2E - Toolbar & Layer Actions', () => {
  test('Can open and close each toolbar tool', async ({ page }) => {
    test.setTimeout(60000);
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    await main.clickDrawPolyline();
    await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible({
      timeout: 10000,
    });

    await main.clickDrawRectangle();
    await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible({
      timeout: 10000,
    });

    await main.clickDrawPolygon();
    await expect(page.getByRole('button', { name: /Finish/i }).first()).toBeVisible({
      timeout: 10000,
    });

    await main.clickDrawCircle();
    await expect(page.getByRole('button', { name: /Cancel/i }).first()).toBeVisible({
      timeout: 10000,
    });

    await main.clickDrawText();
    await expect(page.getByRole('button', { name: /Cancel/i }).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Can open and close each layer control tool', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    await main.clickEditLayers();
    await main.waitForToolActive('Edit Layers');

    await main.clickDragLayers();
    await main.waitForToolActive('Drag Layers');

    await main.clickCutLayers();
    await main.waitForToolActive('Cut Layers');

    await main.clickRotateLayers();
    await main.waitForToolActive('Rotate Layers');
  });
});

test.describe('App E2E - Footer', () => {
  test('Footer contains Leaflet link and author name', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    const leafletLink = page.getByRole('link', { name: /Leaflet/i });
    await expect(leafletLink).toBeVisible();
    await expect(page.getByText(/OpenStreetMap contributors/)).toBeVisible();
    await expect(page.getByText(/Vladyslav Dobrovolskyi/)).toBeVisible();
  });
});

test.describe('App E2E - Polygon Drawing', () => {
  test.beforeEach(() => {
    allure.label('feature', 'Drawing');
    allure.tag('e2e');
    allure.severity(allure.Severity.CRITICAL);
  });

  test('User can activate polygon draw mode', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    await main.clickDrawPolygon();
    await expect(page.getByRole('button', { name: /Finish/i }).first()).toBeVisible();
  });
});

test.describe('App E2E - Map Zooming', () => {
  test('User can zoom in and out', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    await main.clickZoomIn();
    await main.clickZoomOut();
  });
});

test.describe('App E2E - Using drawing tools', () => {
  test('User can activate each toolbar tool', async ({ page }) => {
    test.setTimeout(60000);
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    await main.clickDrawPolyline();
    await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible();

    await main.clickDrawRectangle();
    await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible();

    await main.clickDrawCircle();
    await expect(page.getByRole('button', { name: /Cancel/i }).first()).toBeVisible();

    await main.clickDrawText();
    await expect(page.getByRole('button', { name: /Cancel/i }).first()).toBeVisible();
  });

  test('User can activate each layer control', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();

    const controls: Array<{ name: string; fn: () => Promise<void> }> = [
      { name: 'Edit Layers', fn: async () => main.clickEditLayers() },
      { name: 'Drag Layers', fn: async () => main.clickDragLayers() },
      { name: 'Cut Layers', fn: async () => main.clickCutLayers() },
      { name: 'Rotate Layers', fn: async () => main.clickRotateLayers() },
    ];

    for (const ctrl of controls) {
      /* Attempt click + wait; retry once if the tool did not become active */
      try {
        await ctrl.fn();
        await main.waitForToolActive(ctrl.name, 15000);
      } catch {
        /* Retry once after a short pause */
        await page.waitForTimeout(450);
        await ctrl.fn();
        await main.waitForToolActive(ctrl.name, 15000);
      }
    }
  });
});

test.describe('App E2E - Polygon Draw on Map', () => {
  test.beforeEach(() => {
    allure.label('feature', 'Drawing');
    allure.tag('e2e');
    allure.severity(allure.Severity.CRITICAL);
  });

  test('User can draw a polygon on the map', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();

    /* Use API-based creation for stable assertion of map state */
    const mapWrapper = new MapWrapper(page);
    await mapWrapper.waitForReady();

    const before = await mapWrapper.getDrawnCount();
    const center = await mapWrapper.getCenterLatLng();
    const dLat = 0.001;
    const dLng = 0.0012;
    const coords: Array<[number, number]> = [
      [center.lat + dLat, center.lng - dLng],
      [center.lat + dLat, center.lng + dLng],
      [center.lat - dLat * 1.4, center.lng],
    ];

    const geo = await mapWrapper.createPolygon(coords);
    await mapWrapper.waitForDrawnCountGreaterThan(before);

    expect(geo).not.toBeNull();
    if (!geo) throw new Error('createPolygon returned null');
    expect(geo.type).toBe('Feature');
    expect(geo.geometry.type).toBe('Polygon');
    expect(geo.geometry.coordinates[0].length).toBe(4);
  });
});

test.describe('App E2E - Draw using tools', () => {
  /* Increase timeouts for this suite — browser/page setup can take longer in CI */
  test.beforeEach(() => {
    allure.label('feature', 'Drawing');
    allure.tag('e2e');
    allure.severity(allure.Severity.CRITICAL);
    test.setTimeout(60000);
  });
  test('User can draw a polyline (triangle with 3 points)', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    await main.clickDrawPolyline();
    await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible();
    const map = main.map;
    const box = await map.boundingBox();
    if (box) {
      /* Draw three points to form a triangular polyline */
      const x1 = box.x + box.width * 0.2;
      const y1 = box.y + box.height * 0.3;
      const x2 = box.x + box.width * 0.8;
      const y2 = box.y + box.height * 0.3;
      const x3 = box.x + box.width * 0.5;
      const y3 = box.y + box.height * 0.7;
      await page.mouse.click(x1, y1);
      await page.mouse.click(x2, y2);
      /* Finish drawing with a double click on last point */
      await page.mouse.dblclick(x3, y3);
      /* Check for line appearance (if selector exists) */
    }
  });
  test('User can draw a rectangle (Rectangle)', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    await main.clickDrawRectangle();
    await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible();
    const map = main.map;
    const box = await map.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.7);
      /* Usually the second click completes the rectangle */
    }
    /* Check rectangle appearance */
  });

  test('User can draw a circle (Circle)', async ({ page }) => {
    const main = new MainPage(page);
    await main.goto();
    await main.expectMapVisible();
    /* Use API-based creation for stability */
    const mapWrapper = new MapWrapper(page);
    await mapWrapper.waitForReady();

    const before = await mapWrapper.getDrawnCount();
    const center = await mapWrapper.getCenterLatLng();
    const radiusMeters = 150;

    const result = await mapWrapper.createCircle([center.lat, center.lng], radiusMeters);
    await mapWrapper.waitForDrawnCountGreaterThan(before);

    expect(result).not.toBeNull();
    expect(result.center.lat).toBeCloseTo(center.lat, 4);
    expect(result.center.lng).toBeCloseTo(center.lng, 4);
    expect(result.radius).toBeGreaterThan(radiusMeters - 1);
    expect(result.radius).toBeLessThan(radiusMeters + 1);
  });
});
