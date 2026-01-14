# GitHub Copilot instructions for @gis/core 🧭

This file summarizes the minimal, actionable knowledge an AI coding/test-generation agent needs to be productive in this monorepo (frontend + backend + e2e). Keep it concise and concrete — prefer code snippets and file references over theory.

## Quick architecture overview

- Monorepo managed by pnpm workspaces; main packages: `@gis/frontend`, `@gis/backend`, `@gis/e2e`, and `@gis/shared`.
- Frontend: Vue 3 + TypeScript, Leaflet via `@vue-leaflet/vue-leaflet`, and Geoman (`@geoman-io/leaflet-geoman-free`) for drawing tools.
- E2E: Playwright tests live under `e2e/` (Playwright config: `e2e/playwright.config.ts`). Tests interact with the real UI and map controls.

## Key commands (run from repository root)

- Start all dev apps: `pnpm dev` (runs shared + apps concurrently)
- Run frontend only: `pnpm frontend:dev`
- Run e2e tests (headless): `pnpm e2e:headless`
- Run e2e tests (headed): `pnpm e2e:headed`
- Install Playwright browsers: `pnpm e2e:install-browsers`
- Generate Allure report after tests: `pnpm run allure:report`

## Testing and test structure (what to generate)

- Location: `e2e/tests/` (use `*.spec.ts` naming). PageObjects live in `e2e/pageobjects/`.
- Prefer Page Object Model: create composable pageobjects (e.g., `MapWrapper`, `GeomanControls`, `MainPage`). Example: `MainPage.drawCircleOnMap(centerX, centerY, radiusPx)`.
- Use Playwright `test.step()` to group logical actions and improve report readability.

## Stable locators & map interaction patterns (concrete)

- Control buttons: prefer container selectors or titles, not button text alone:
  - `page.locator('.leaflet-buttons-control-button', { hasText: 'Draw Circle' }).first()`
  - or use `page.getByTitle(/circle/i)` when titles are present
- Map container: `.leaflet-container`
  - Get coordinates with `const box = await page.locator('.leaflet-container').boundingBox()` and compute pixel positions.
- Draw interactions: use deterministic mouse clicks with pixel offsets relative to the container. Avoid visual-only checks.
  - Example: `await page.mouse.click(centerX, centerY); await page.mouse.click(centerX + radius, centerY);`
- Layers / draw results: use `path.leaflet-interactive` or `.leaflet-marker-icon` to detect created features; prefer inspecting Leaflet internals via `page.evaluate` when necessary.

## Loader & readiness checks

- Loader component: `apps/frontend/src/components/Loader.vue` renders `<div class="loader-overlay" role="status">`.
- Wait reliably for data to finish loading:
  - `await page.getByRole('status').waitFor({ state: 'detached' })` (preferred)
  - fallback: `await page.waitForSelector('.loader-overlay', { state: 'detached' })`
- Also ensure `.leaflet-container` is visible before interacting with map.

## Playwright config & artifacts

- `e2e/playwright.config.ts` sets tracing/screenshot/video to capture failures and uses `allure-playwright` reporter.
- Keep assertions retry-friendly and rely on Playwright auto-waiting (`await expect(locator).toBeVisible();`) rather than manual sleeps.

## Test data & mocking

- Prefer to mock heavy GeoJSON responses in e2e or unit tests using `page.route('**/api/**', route => route.fulfill(...))` or use small fixtures in `e2e/fixtures/`.
- For unit tests, project already mocks `leaflet` and `@geoman-io/leaflet-geoman-free` in `apps/frontend/tests/setupTests.ts`.

## Code conventions specific to this repo

- PageObject names: use `*Button` suffix for control locators (e.g., `drawCircleButton`) and verb-based method names for actions (e.g., `drawCircleOnMap(x,y,radiusPx)`).
- Avoid test-only CSS or unstable XPaths. Make locators resilient with `hasText`, `getByRole`, or class+attribute combinations.

## Example snippet — stable draw Circle test

```ts
// e2e/tests/draw-circle.e2e.spec.ts
import { test, expect } from '@playwright/test';
import { MainPage } from '@/pageobjects/MainPage';

test('draw circle by radius', async ({ page }) => {
  const main = new MainPage(page);
  await main.goto();
  await page
    .getByRole('status')
    .waitFor({ state: 'detached' })
    .catch(() => {});
  await main.expectMapVisible();
  await main.clickDrawCircle();
  const box = await main.map.boundingBox();
  const cx = box.width / 2;
  const cy = box.height / 2;
  await main.drawCircleOnMap(cx, cy, 120);
  // verify layer exists
  // await expect(page.locator('path.leaflet-interactive')).toHaveCount(1);
});
```

## Troubleshooting & tips

- If drawing clicks land incorrectly, verify Playwright viewport is stable (`playwright.config.ts` projects settings) and set explicit viewport in the test if needed.
- Use `page.pause()` during development to inspect and step through user flows.
- On CI, browser artifacts and Allure reports are essential — ensure `allure-results` are gathered from each service.

---

If you'd like, I can now:

1. Add missing PageObject components (e.g., `GeomanControls.ts` skeleton) and example tests, or
2. Run the e2e suite and report failures with suggested fixes.

Which would you prefer next? (Pick 1 or 2 or both.)
