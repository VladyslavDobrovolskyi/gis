import { Page, expect } from '@playwright/test';

export class GeomanControls {
  readonly page: Page;

  /**
   * Create a `GeomanControls` wrapper for interacting with drawing controls.
   * @param page Playwright `Page` instance used to interact with the test page.
   */
  constructor(page: Page) {
    this.page = page;
  }

  async clickDrawCircle() {
    /* Circle often rendered as a title-only control; prefer title-based locator */
    const byTitle = this.page.getByTitle(/circle|draw a circle|draw circle/i).first();
    try {
      await expect(byTitle).toBeVisible({ timeout: 1500 });
      await byTitle.click();
      return;
    } catch {
      /* Fallbacks: text-based container -> button, then generic hasText */
      try {
        const byText = this.page.getByText('Draw Circle').locator('..').getByRole('button').first();
        await expect(byText).toBeVisible({ timeout: 1500 });
        await byText.click();
        return;
      } catch {
        const btn = this.page
          .locator('.leaflet-buttons-control-button', { hasText: 'Draw Circle' })
          .first();
        await expect(btn).toBeVisible({ timeout: 1000 });
        await btn.click();
      }
    }
  }

  async clickDrawPolygon() {
    /* Try title-based or aria-friendly locators first */
    const byTitle = this.page.getByTitle(/polygon|polygons|draw polygon/i).first();
    try {
      await expect(byTitle).toBeVisible({ timeout: 1500 });
      await byTitle.click();
      return;
    } catch {
      const byText = this.page.getByText('Draw Polygons').locator('..').getByRole('button').first();
      try {
        await expect(byText).toBeVisible({ timeout: 1500 });
        await byText.click();
        return;
      } catch {
        /* Try relaxed text match */
        const maybe = this.page
          .locator('.leaflet-buttons-control-button')
          .filter({ hasText: /Polygons?|Polygon/i })
          .first();
        try {
          await expect(maybe).toBeVisible({ timeout: 1000 });
          await maybe.click();
          return;
        } catch {
          /* Last resort: click the 3rd control button in the toolbar (index 2) */
          const nthBtn = this.page.locator('.leaflet-buttons-control-button').nth(2);
          await expect(nthBtn).toBeVisible({ timeout: 1000 });
          await nthBtn.click();
        }
      }
    }
  }

  async clickDrawRectangle() {
    const byTitle = this.page.getByTitle(/rectangle|draw rectangle/i).first();
    try {
      await expect(byTitle).toBeVisible({ timeout: 1500 });
      await byTitle.click();
      return;
    } catch {
      try {
        const byText = this.page
          .getByText('Draw Rectangle')
          .locator('..')
          .getByRole('button')
          .first();
        await expect(byText).toBeVisible({ timeout: 1500 });
        await byText.click();
        return;
      } catch {
        const btn = this.page
          .locator('.leaflet-buttons-control-button', { hasText: 'Draw Rectangle' })
          .first();
        await expect(btn).toBeVisible({ timeout: 1000 });
        await btn.click();
      }
    }
  }
}
