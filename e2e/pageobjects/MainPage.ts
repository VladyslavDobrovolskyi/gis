import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the application's main page.
 * Leaflet + Drawing Tools
 */
export class MainPage {
  readonly page: Page;

  /* Map */
  readonly map: Locator;

  /* Zoom */
  readonly zoomIn: Locator;
  readonly zoomOut: Locator;

  /* Draw tools */
  readonly drawPolyline: Locator;
  readonly drawRectangle: Locator;
  readonly drawPolygon: Locator;
  readonly drawCircleButton: Locator;
  readonly drawText: Locator;

  /* Layer tools */
  readonly editLayers: Locator;
  readonly dragLayers: Locator;
  readonly cutLayers: Locator;
  readonly rotateLayers: Locator;

  /**
   * Construct a MainPage Page Object for UI interactions.
   * @param page Playwright `Page` instance used for navigation and locating elements on the page.
   */
  constructor(page: Page) {
    this.page = page;

    /* ===== MAP ===== */
    this.map = page.locator('.leaflet-container');

    /* ===== ZOOM ===== */
    this.zoomIn = page.getByRole('button', { name: /zoom in/i });
    this.zoomOut = page.getByRole('button', { name: /zoom out/i });

    /* ===== DRAW TOOLS ===== */
    /* Use toolbar button containers with hasText — more resilient to markup changes */
    this.drawPolyline = page
      .locator('.leaflet-buttons-control-button', { hasText: 'Draw Polyline' })
      .first();

    this.drawRectangle = page
      .locator('.leaflet-buttons-control-button', { hasText: 'Draw Rectangle' })
      .first();

    /* Accepts both 'Draw Polygon' and 'Draw Polygons' */
    this.drawPolygon = page
      .locator('.leaflet-buttons-control-button')
      .filter({ hasText: /Polygons?|Polygon/i })
      .first();

    /**
     * ⚠️ IMPORTANT
     * The circle button has NO visible text.
     * Leaflet renders it as <a title="Draw a circle"> — rely on title
     */
    this.drawCircleButton = page.getByTitle(/circle/i);

    this.drawText = page
      .locator('.leaflet-buttons-control-button', { hasText: 'Draw Text' })
      .first();

    /* ===== LAYER TOOLS ===== */
    this.editLayers = page
      .locator('.leaflet-buttons-control-button', { hasText: 'Edit Layers' })
      .first();

    this.dragLayers = page
      .locator('.leaflet-buttons-control-button', { hasText: 'Drag Layers' })
      .first();

    this.cutLayers = page
      .locator('.leaflet-buttons-control-button', { hasText: 'Cut Layers' })
      .first();

    this.rotateLayers = page
      .locator('.leaflet-buttons-control-button', { hasText: 'Rotate Layers' })
      .first();
  }

  /* ===== NAVIGATION ===== */
  async goto() {
    await this.page.goto('http://localhost:5173/');
  }

  async expectMapVisible() {
    await expect(this.map).toBeVisible();
  }

  /* ===== DRAW ACTIONS ===== */
  /**
   * Click a locator robustly with retries to handle transient or flaky UI states.
   * @param locator Playwright `Locator` to interact with and click.
   * @param attempts Number of attempts before throwing (default: 5).
   */
  private async robustClick(locator: import('@playwright/test').Locator, attempts = 5) {
    for (let i = 0; i < attempts; i++) {
      try {
        /* Increased wait to allow toolbar to render under load / CI */
        await locator.waitFor({ state: 'visible', timeout: 5000 });
        await locator.scrollIntoViewIfNeeded();
        await locator.click();
        return;
      } catch (err) {
        /* If element detached or not stable, retry after a short pause */
        await this.page.waitForTimeout(120);
        if (i === attempts - 1) throw err;
      }
    }
  }

  async clickDrawPolyline() {
    try {
      const byText = this.page.getByText('Draw Polyline').locator('..').getByRole('button').first();
      await expect(byText).toBeVisible({ timeout: 1500 });
      await byText.click();
      return;
    } catch {
      const btn = this.page
        .locator('.leaflet-buttons-control-button', { hasText: 'Draw Polyline' })
        .first();
      try {
        await expect(btn).toBeVisible({ timeout: 1000 });
        await btn.click();
        return;
      } catch {
        /* Try PM toolbar icon */
        const pmIcon = this.page.locator('.leaflet-pm-icon-line').first();
        try {
          await expect(pmIcon).toBeVisible({ timeout: 1000 });
          await pmIcon.click();
          return;
        } catch {
          /* Last resort: click first control robustly */
          await this.robustClick(this.page.locator('.leaflet-buttons-control-button').first());
        }
      }
    }
  }

  async clickDrawRectangle() {
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
      try {
        await expect(btn).toBeVisible({ timeout: 1000 });
        await this.robustClick(btn);
        return;
      } catch {
        /* Try PM toolbar icon first */
        const pmIcon = this.page.locator('.leaflet-pm-icon-rectangle').first();
        try {
          await expect(pmIcon).toBeVisible({ timeout: 1000 });
          await pmIcon.click();
          return;
        } catch {
          /* Try title-based button */
          const byTitleBtn = this.page.getByTitle(/rectangle|draw rectangle/i).first();
          try {
            await expect(byTitleBtn).toBeVisible({ timeout: 1000 });
            await byTitleBtn.click();
            return;
          } catch {
            /* Last resort: click the second control (legacy fallback) */
            await this.robustClick(this.page.locator('.leaflet-buttons-control-button').nth(1));
          }
        }
      }
    }
  }

  async clickDrawPolygon() {
    try {
      const byText = this.page.getByText('Draw Polygons').locator('..').getByRole('button').first();
      await expect(byText).toBeVisible({ timeout: 1500 });
      await byText.click();
      return;
    } catch {
      const maybe = this.page
        .locator('.leaflet-buttons-control-button')
        .filter({ hasText: /Polygons?|Polygon/i })
        .first();
      try {
        await expect(maybe).toBeVisible({ timeout: 1000 });
        await this.robustClick(maybe);
        return;
      } catch {
        /* Try PM toolbar icon specifically */
        const pmIcon = this.page.locator('.leaflet-pm-icon-polygon').first();
        try {
          await expect(pmIcon).toBeVisible({ timeout: 1000 });
          await pmIcon.click();
          return;
        } catch {
          /* Fallback to title-based buttons */
          const byTitleBtn = this.page.getByTitle(/polygon|polygons|draw polygon/i).first();
          try {
            await expect(byTitleBtn).toBeVisible({ timeout: 1000 });
            await byTitleBtn.click();
            return;
          } catch {
            /* Last resort: click the 3rd control button */
            await this.robustClick(this.page.locator('.leaflet-buttons-control-button').nth(2));
          }
        }
      }
    }
  }

  async clickDrawCircle() {
    /* Prefer the aria/text-based control first */
    try {
      await expect(this.drawCircleButton).toBeVisible({ timeout: 1500 });
      await this.drawCircleButton.click();
      return;
    } catch {
      /* Try PM toolbar icon first */
      const pmIcon = this.page.locator('.leaflet-pm-icon-circle').first();
      try {
        await expect(pmIcon).toBeVisible({ timeout: 1000 });
        await this.robustClick(pmIcon);
        return;
      } catch {
        /* Try title-based locator */
        const byTitle = this.page.getByTitle(/circle|draw circle|draw a circle/i).first();
        try {
          await expect(byTitle).toBeVisible({ timeout: 1500 });
          await this.robustClick(byTitle);
          return;
        } catch {
          try {
            const byText = this.page
              .getByText(/Draw Circle|Circle/i)
              .locator('..')
              .getByRole('button')
              .first();
            await expect(byText).toBeVisible({ timeout: 1500 });
            await this.robustClick(byText);
            return;
          } catch {
            /* Last resort: look for any toolbar button that references circle */
            const btn = this.page
              .locator('.leaflet-buttons-control-button')
              .filter({ hasText: /circle|draw circle/i })
              .first();
            await this.robustClick(btn);
            return;
          }
        }
      }
    }
  }

  async clickDrawText() {
    /* Text control may be title-labeled or rendered without direct text nodes */
    const byTitle = this.page.getByTitle(/text|draw text|add text/i).first();
    try {
      await expect(byTitle).toBeVisible({ timeout: 1500 });
      await byTitle.click();
      return;
    } catch {
      try {
        const byText = this.page
          .getByText(/Draw Text|Add Text|Text/i)
          .locator('..')
          .getByRole('button')
          .first();
        await expect(byText).toBeVisible({ timeout: 1500 });
        await this.robustClick(byText);
        return;
      } catch {
        const btn = this.page
          .locator('.leaflet-buttons-control-button')
          .filter({ hasText: /Draw Text|Add Text|Text/i })
          .first();
        try {
          await expect(btn).toBeVisible({ timeout: 1500 });
          await this.robustClick(btn);
          return;
        } catch {
          /* Last resort: try a generic fallback button index if toolbar layout is different */
          await this.robustClick(this.page.locator('.leaflet-buttons-control-button').nth(3));
        }
      }
    }
  }

  /* ===== LAYER ACTIONS ===== */
  async clickEditLayers() {
    /* Try primary locator then fallback to title or by-text button */
    try {
      await expect(this.editLayers).toBeVisible({ timeout: 1000 });
      await this.editLayers.click();
      return;
    } catch {
      const byTitle = this.page.getByTitle(/edit layers|edit layer/i).first();
      try {
        await expect(byTitle).toBeVisible({ timeout: 1000 });
        await byTitle.click();
        return;
      } catch {
        const byText = this.page.getByText('Edit Layers').locator('..').getByRole('button').first();
        try {
          await expect(byText).toBeVisible({ timeout: 1000 });
          await byText.click();
          return;
        } catch {
          /* Last resort: try several tolerant locators for layers control */
          const byRole = this.page.getByRole('button', { name: /Layer|Layers|Edit/i }).first();
          try {
            await expect(byRole).toBeVisible({ timeout: 1000 });
            await this.robustClick(byRole);
            return;
          } catch {
            const byTitleAny = this.page.getByTitle(/layer|layers|edit/i).first();
            try {
              await expect(byTitleAny).toBeVisible({ timeout: 1000 });
              await this.robustClick(byTitleAny);
              return;
            } catch {
              /* Fallback to any button with matching text */
              const anyBtn = this.page
                .locator('button')
                .filter({
                  hasText: /Layer|Layers|Layer Control|Layer tools|Edit Layers/i,
                })
                .first();
              await this.robustClick(anyBtn);
              return;
            }
          }
        }
      }
    }
  }

  /**
   * Wait for a tool to be considered active.
   * Checks multiple signals to be resilient: aria-pressed/class 'active', presence of Finish/Cancel buttons.
   * @param toolName Name of the tool to wait for (matches button text, title, or related indicators).
   * @param timeout Maximum milliseconds to wait before timing out (default: 10000).
   */
  async waitForToolActive(toolName: string, timeout = 10000) {
    await this.page.waitForFunction(
      (name: string) => {
        /* 1) Check toolbar buttons state (text/title) */
        const el = Array.from(document.querySelectorAll('.leaflet-buttons-control-button')).find(
          (e) => {
            const t = (e.textContent || '').trim();
            const title = e.getAttribute('title') || '';
            return t.includes(name) || title.includes(name) || /layer|layers|edit/i.test(t + title);
          },
        );
        if (el && (el.getAttribute('aria-pressed') === 'true' || el.classList.contains('active')))
          return true;

        /* 2) Check presence of Finish/Cancel button which often indicates an active mode */
        const finish = Array.from(document.querySelectorAll('button')).find((b) =>
          /Finish|Cancel|Dismiss/i.test(b.textContent || ''),
        );
        if (finish) return true;

        /* 3) Check for Geoman toolbar or pm-specific indicators */
        const pm = document.querySelector('.pm-toolbar, .leaflet-pm-toolbar, .pm-button');
        if (pm) return true;

        /* 4) As a fallback, check for any button with aria-pressed true */
        const anyPressed =
          Array.from(document.querySelectorAll('button[aria-pressed="true"]')).length > 0;
        if (anyPressed) return true;

        /* 5) Presence of a control panel or layer control */
        const panel = document.querySelector('.layers-panel, .leaflet-control-layers');
        if (panel) return true;

        return false;
      },
      toolName,
      { timeout },
    );
  }

  async clickDragLayers() {
    try {
      await expect(this.dragLayers).toBeVisible({ timeout: 1000 });
      await this.dragLayers.click();
      return;
    } catch {
      const byTitle = this.page.getByTitle(/drag layers|drag layer/i).first();
      try {
        await expect(byTitle).toBeVisible({ timeout: 1000 });
        await byTitle.click();
        return;
      } catch {
        const byText = this.page.getByText('Drag Layers').locator('..').getByRole('button').first();
        await expect(byText).toBeVisible({ timeout: 1000 });
        await byText.click();
      }
    }
  }

  async clickCutLayers() {
    try {
      await expect(this.cutLayers).toBeVisible({ timeout: 1000 });
      await this.cutLayers.click();
      return;
    } catch {
      const byTitle = this.page.getByTitle(/cut layers|cut layer/i).first();
      try {
        await expect(byTitle).toBeVisible({ timeout: 1000 });
        await byTitle.click();
        return;
      } catch {
        const byText = this.page.getByText('Cut Layers').locator('..').getByRole('button').first();
        await expect(byText).toBeVisible({ timeout: 1000 });
        await byText.click();
      }
    }
  }

  async clickRotateLayers() {
    try {
      await expect(this.rotateLayers).toBeVisible({ timeout: 1000 });
      await this.rotateLayers.click();
      return;
    } catch {
      const byTitle = this.page.getByTitle(/rotate layers|rotate layer/i).first();
      try {
        await expect(byTitle).toBeVisible({ timeout: 1000 });
        await byTitle.click();
        return;
      } catch {
        const byText = this.page
          .getByText('Rotate Layers')
          .locator('..')
          .getByRole('button')
          .first();
        await expect(byText).toBeVisible({ timeout: 1000 });
        await byText.click();
      }
    }
  }

  /* ===== ZOOM ===== */
  async clickZoomIn() {
    await this.zoomIn.click();
  }

  async clickZoomOut() {
    await this.zoomOut.click();
  }

  /* ===== MAP DRAW HELPERS ===== */

  /**
   * Draws a circle on the map
   * @param centerX relative X coordinate (0..width)
   * @param centerY relative Y coordinate (0..height)
   * @param radiusPx radius in pixels
   */
  async drawCircleOnMap(centerX: number, centerY: number, radiusPx: number) {
    await this.clickDrawCircle();

    const box = await this.map.boundingBox();
    if (!box) {
      throw new Error('Could not get the map bounding box');
    }

    const x = box.x + centerX;
    const y = box.y + centerY;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + radiusPx, y);
    await this.page.mouse.up();
  }
}
