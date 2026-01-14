import { test, expect } from '@playwright/test';
import { MainPage } from '@/pageobjects/MainPage';
import * as allure from 'allure-js-commons';

test.describe('Map Editing', () => {
  test.beforeEach(() => {
    /* Set suite-level Allure metadata while a test is running */
    allure.epic('Map Editing');
  });

  test.describe('Drawing Tools', () => {
    test.beforeEach(() => {
      /* Set group-level Allure metadata inside a running test */
      allure.feature('Drawing Tools');
    });

    test.describe('Draw using tools', () => {
      test.beforeEach(() => {
        allure.story('Draw using tools');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
        test.setTimeout(60000);
      });

      test('User can draw a polyline (triangle with 3 points)', async ({ page }) => {
        const main = new MainPage(page);

        await test.step('Open app and ensure map visible', async () => {
          await main.goto();
          await main.expectMapVisible();
        });

        await test.step('Activate Draw Polyline tool', async () => {
          await main.clickDrawPolyline();
          await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible();
        });

        await test.step('Draw triangle polyline using three points', async () => {
          const map = main.map;
          const box = await map.boundingBox();
          if (box) {
            const x1 = box.x + box.width * 0.2;
            const y1 = box.y + box.height * 0.3;
            const x2 = box.x + box.width * 0.8;
            const y2 = box.y + box.height * 0.3;
            const x3 = box.x + box.width * 0.5;
            const y3 = box.y + box.height * 0.7;
            await page.mouse.click(x1, y1);
            await page.mouse.click(x2, y2);
            await page.mouse.dblclick(x3, y3);
          }
        });
      });

      test('User can draw a rectangle (Rectangle)', async ({ page }) => {
        const main = new MainPage(page);

        await test.step('Open app and ensure map visible', async () => {
          await main.goto();
          await main.expectMapVisible();
        });

        await test.step('Activate Draw Rectangle tool', async () => {
          await main.clickDrawRectangle();
          await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible();
        });

        await test.step('Draw rectangle by clicking two opposite corners', async () => {
          const map = main.map;
          const box = await map.boundingBox();
          if (box) {
            await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
            await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.7);
          }
        });
      });

      test('User can add text (Text)', async ({ page }) => {
        const main = new MainPage(page);

        await test.step('Open app and ensure map visible', async () => {
          await main.goto();
          await main.expectMapVisible();
        });

        await test.step('Activate Draw Text tool', async () => {
          await main.clickDrawText();
          await expect(page.getByRole('button', { name: /Cancel/i }).first()).toBeVisible();
        });

        await test.step('Add a text label by clicking on the map', async () => {
          const map = main.map;
          const box = await map.boundingBox();
          if (box) {
            await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6);
          }
        });
      });
    });
  });
});
