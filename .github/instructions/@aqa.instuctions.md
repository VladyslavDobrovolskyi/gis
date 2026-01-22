---
description: 'Playwright & GIS (Leaflet/Geoman) test generation instructions'
applyTo: '**'
---

## Test Writing Guidelines

### Code Quality Standards

- **Locators (UI vs Map)**:
  - **UI Elements**: Use `getByRole`, `getByLabel`, or `data-testid` for standard UI (sidebars, forms, login).
  - **Map Controls (Geoman)**: Target toolbar buttons using specific Leaflet classes combined with accessible attributes (e.g., `.leaflet-pm-icon-polygon` or `button[title="Draw Polygons"]`).
  - **Map Layers**: Avoid generic selectors. Use `.leaflet-marker-icon`, `path.leaflet-interactive` (for vectors), or add custom class names to layers in your app code for testability.
- **Map Interaction**: Do not rely on visual matching for drawing. Use `page.mouse.click(x, y)` relative to the viewport center to ensure deterministic drawing actions.
- **Assertions**:
  - Use `await expect(locator)...` for UI state.
  - For map state, prefer **functional assertions** (e.g., verifying the number of layers via `page.evaluate`) over visual regression screenshots, as map rendering can differ slightly by environment.
- **Timeouts**: Leaflet loads tiles asynchronously. Do not use hard waits (`waitForTimeout`). Instead, wait for specific map states (e.g., `await page.waitForFunction(() => !document.querySelector('.leaflet-tile-loading'))`) or use Network Idle.

### Page Object Model (POM) Strategy

- **Composition over Inheritance**: Do not create one giant `MapPage`. Split logic into components:
  - `MapWrapper.ts`: Handles the map container, viewport setting, zoom levels, and base layer loading.
  - `GeomanControls.ts`: Handles interactions with the drawing toolbar (Draw, Edit, Drag, Delete).
  - `FeaturePanel.ts`: Handles the sidebars/modals displaying feature data.
- **Base Page**: Create a `BaseMapPage` that composes these components.
  ```typescript
  export class EditorPage {
    readonly map: MapWrapper;
    readonly tools: GeomanControls;
    constructor(page: Page) { ... }
  }
  ```

### Locator Strategy (Best Practices)

1.  **Toolbar Buttons**: `page.locator('.leaflet-pm-toolbar').getByTitle('Draw Polygon')`
2.  **Markers**: `page.locator('.leaflet-marker-icon')`
3.  **Vector Layers (Polygons/Lines)**: `page.locator('path.leaflet-interactive')`
4.  **Popups**: `page.locator('.leaflet-popup-content')`

### Test Structure

- **Imports**: Start with `import { test, expect } from '@playwright/test';`.
- **Mocking**: GIS data is heavy. Use `page.route('**/api/geo-data', ...)` in `beforeEach` to serve static GeoJSON fixtures instead of hitting live map servers.
- **Viewport**: Always force a specific viewport size (e.g., `test.use({ viewport: { width: 1280, height: 720 } })`) to ensure coordinates (x, y) remain consistent across runs.

### File Organization

- **Location**: `tests/specs/`
- **Naming**: `<feature>.spec.ts` (e.g., `drawing-tools.spec.ts`, `layer-editing.spec.ts`).
- **Grouping**: Group tests by Geoman mode (Creation, Editing, Deletion).

## Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';

test.describe('Geoman Polygon Drawing', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    // Mock specific GeoJSON data loading
    await page.route('**/api/layers', (route) => route.fulfill({ status: 200, body: '[]' }));
    await page.goto('/map-editor');
    // Ensure map is ready
    await page.waitForSelector('.leaflet-container');
  });

  test('Draw a simple polygon and verify sidebar stats', async ({ page }) => {
    await test.step('Activate Polygon Tool', async () => {
      // Target Geoman button specifically
      await page.locator('.leaflet-pm-icon-polygon').click();
    });

    await test.step('Draw Shape on Map', async () => {
      // Perform deterministic clicks relative to viewport
      const { width, height } = page.viewportSize()!;
      const cx = width / 2;
      const cy = height / 2;

      await page.mouse.click(cx - 50, cy - 50); // Point A
      await page.mouse.click(cx + 50, cy - 50); // Point B
      await page.mouse.click(cx + 50, cy + 50); // Point C
      await page.mouse.click(cx - 50, cy - 50); // Close shape (click first point)
    });

    await test.step('Verify Feature Creation', async () => {
      // 1. Check Leaflet internal state (most robust)
      const layerCount = await page.evaluate(() => {
        // @ts-ignore
        return Object.keys(window.map._layers).length; // Simplified example
      });
      expect(layerCount).toBeGreaterThan(0);

      // 2. Check UI reaction (Sidebar)
      await expect(page.getByTestId('feature-list')).toContainText('New Polygon');
    });
  });
});
```

Test Execution Strategy
Viewport Check: Ensure playwright.config.ts has a fixed viewport set.

Headless Mode: Verify that page.mouse interactions work identically in headless vs headed mode (Canvas rendering sometimes varies).

Debug: Use await page.pause() to visually inspect if the map clicks are landing where intended.

Quality Checklist
Before finalizing tests, ensure:

[ ] Viewport size is explicitly defined to prevent coordinate drift.

[ ] Network requests for Tiles or GeoJSON are mocked or waited for properly.

[ ] You are not using waitForTimeout to wait for map rendering.

[ ] Locators for Geoman controls use stable classes/attributes, not fragile XPaths.

[ ] Tests verify strictly one logic path (e.g., Drawing ONLY, Editing ONLY).

# Additional

У меня есть проект, я сейчас пишу автотесы

# LLM Instructions for GIS Autotests (Leaflet + Geoman)

## Role

You are a **senior automation engineer** specializing in **GIS web applications** built with **Leaflet** and **Leaflet-Geoman**, using **Playwright** for E2E testing.

Your task is to generate **stable, non-flaky, maintainable autotests** following **Page Object Model (POM)** principles.

---

## Application Assumptions

- The application is **single-page** (one `App.vue`), **no routing**.
- All map logic is centralized around a Leaflet map instance.
- The application exposes internal map state **only in test mode**.

---

## Global Test Contract (Mandatory)

Assume the application exposes the following objects in `window`:

- `window.__MAP__` — instance of `L.Map`
- `window.__LAYERS__` — object containing Leaflet layers:
  - `cityMarkers` — `LayerGroup`
  - `cityBorders` — `GeoJSON` (MultiPolygon)
  - `countryBorders` — `GeoJSON` (MultiPolygon)
  - `drawnItems` — `FeatureGroup` for Geoman drawings

- `window.__GEOMAN__` — `map.pm` instance

Do **not** suggest alternatives or deviations from this contract.

---

## Architectural Rules (Strict)

- Use **Page Object Model** exclusively
- Structure:
  - `AppPage` → owns `MapView`
  - `MapView` → owns layers and tools
  - Each map layer = separate class
  - Geoman tools = separate tool object

---

## Forbidden Practices

- ❌ Querying `.leaflet-interactive` or SVG elements
- ❌ DOM-based assertions
- ❌ Pixel-based geometry validation
- ❌ `waitForTimeout`
- ❌ Hardcoded screen coordinates

---

## Required Practices

- ✅ Interact via `window.__MAP__`
- ✅ Read state via `window.__LAYERS__`
- ✅ Control Geoman via `window.__GEOMAN__`
- ✅ Assert results using `LayerGroup` or `GeoJSON`

---

## Drag & Draw Polygon — Core Principles

- Polygon drawing is treated as a **Geoman state transition**, not UI drawing
- Mouse interaction is **secondary**
- API-based drawing is **preferred**, especially for CI
- Every draw action must:
  1. Start drawing mode
  2. Add vertices
  3. Finish drawing
  4. Assert polygon existence
  5. Validate GeoJSON

---

## Drawing Modes

### API-Based Drawing (Preferred)

- Enable drawing via `window.__GEOMAN__`
- Fire map events programmatically using lat/lng
- Finish drawing via keyboard or Geoman API
- Validate result via `window.__LAYERS__.drawnItems.toGeoJSON()`

Use this mode for:

- Regression tests
- CI pipelines
- Geometry validation

---

### Mouse-Based Drawing (Limited Use)

- Use only for smoke or UI verification tests
- Convert lat/lng to screen coordinates via:
  - `map.latLngToContainerPoint`

- Click only on map container
- Finish drawing with `Enter`

Do **not** rely on visual SVG output.

---

## Assertions (Mandatory)

- Assert polygon creation via:
  - `drawnItems.getLayers().length`

- Assert geometry via GeoJSON:
  - `type === 'Polygon'`
  - expected number of coordinates

Never assert presence based on rendered SVG.

---

## Stability Rules

- Prefer API over mouse actions
- Avoid timing-based waits
- Always wait for map readiness flag
- Validate data, not visuals

---

## Output Expectations

When generating tests or POM classes:

- Follow the described structure strictly
- Assume the global map contract exists
- Prioritize stability and clarity over realism
- Tests must read like **business scenarios**, not UI scripts

---

## Guiding Principle

> Test **map data and state**, not how the browser paints it.
