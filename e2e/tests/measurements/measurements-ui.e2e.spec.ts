import { test, expect, type Page } from '@playwright/test';
import { MainPage } from '@/pageobjects/MainPage';
import * as allure from 'allure-js-commons';

/* Measurement badge tests for UI-driven drawings */

test.describe('Map Editing', () => {
  test.describe('Measurements', () => {
    test.describe('UI-driven measurement badge', () => {
      test.beforeEach(() => {
        allure.epic('Map Editing');
        allure.feature('Measurements');
        allure.story('UI-driven measurement badge');
        allure.tag('e2e');
        allure.severity(allure.Severity.NORMAL);
      });

      test('Circle drawn via toolbar shows measurement badge with area', async ({
        page,
      }: {
        page: Page;
      }) => {
        test.setTimeout(60000);
        const main = new MainPage(page);
        await test.step('Open app and ensure map visible', async () => {
          await main.goto();
          await main.expectMapVisible();
        });

        const map = main.map;
        const box = await map.boundingBox();
        if (!box) throw new Error('map bounding box not found');

        /* Draw circle via UI: center at middle, radius ~80px */
        await test.step('Draw circle via toolbar', async () => {
          await main.drawCircleOnMap(box.width * 0.5, box.height * 0.5, 80);
        });

        /* Wait for a drawn interactive layer to appear, hover it to reveal the badge if needed,
           then wait longer for the measurement badge to appear */
        await test.step('Wait for drawn layer and hover to reveal badge', async () => {
          const layer = page.locator('.leaflet-interactive').first();
          await layer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          try {
            await layer.hover({ timeout: 2000 });
          } catch {
            /* ignore hover failures */
          }
        });

        const badge = await page.waitForSelector('.measurement-badge', {
          state: 'visible',
          timeout: 5000,
        });
        const text = (await badge.textContent()) || '';
        /* Expect number and unit — either distance • area or a single area/distance value */
        expect(text).toMatch(/\d/);
        expect(/m\u00B2|km\u00B2|m\b|km\b|\u00B7|•/.test(text)).toBeTruthy();
      });

      test('Polygon drawn via toolbar shows measurement badge with area', async ({
        page,
      }: {
        page: Page;
      }) => {
        const main = new MainPage(page);
        await test.step('Open app and ensure map visible', async () => {
          await main.goto();
          await main.expectMapVisible();
        });

        await main.clickDrawPolygon();

        const box = await main.map.boundingBox();
        if (!box) throw new Error('map bounding box not found');

        const x1 = box.x + box.width * 0.3;
        const y1 = box.y + box.height * 0.3;
        const x2 = box.x + box.width * 0.7;
        const y2 = box.y + box.height * 0.3;
        const x3 = box.x + box.width * 0.5;
        const y3 = box.y + box.height * 0.6;

        await test.step('Draw polygon points', async () => {
          await page.mouse.click(x1, y1);
          await page.mouse.click(x2, y2);
          /* Finish polygon with double click on third point */
          await page.mouse.dblclick(x3, y3);
        });

        await test.step('Hover drawn layer and assert measurement badge', async () => {
          const layer = page.locator('.leaflet-interactive').first();
          await layer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          try {
            await layer.hover({ timeout: 2000 });
          } catch {
            /* ignore */
          }

          const badge = await page.waitForSelector('.measurement-badge', {
            state: 'visible',
            timeout: 5000,
          });
          const text = (await badge.textContent()) || '';
          expect(text).toMatch(/\d/);
          expect(/m²|km²|m|km/i.test(text)).toBeTruthy();
        });
      });

      test('Rectangle drawn via toolbar shows measurement badge with area', async ({
        page,
      }: {
        page: Page;
      }) => {
        const main = new MainPage(page);
        await test.step('Open app and ensure map visible', async () => {
          await main.goto();
          await main.expectMapVisible();
        });

        await main.clickDrawRectangle();
        const box = await main.map.boundingBox();
        if (!box) throw new Error('map bounding box not found');

        await test.step('Draw rectangle and assert measurement badge visible', async () => {
          await page.mouse.click(box.x + box.width * 0.35, box.y + box.height * 0.35);
          await page.mouse.click(box.x + box.width * 0.65, box.y + box.height * 0.65);

          const badge = await page.waitForSelector('.measurement-badge', {
            state: 'visible',
            timeout: 2000,
          });
          const text = (await badge.textContent()) || '';
          expect(text).toMatch(/\d/);
          expect(/m²|km²|m|km/i.test(text)).toBeTruthy();
        });
      });
    });
  });
});
