import { test, expect } from '@playwright/test';
import { MainPage } from '../pageobjects/MainPage';
import * as allure from 'allure-js-commons';

test.describe('App E2E - Toolbar Tools', () => {
  test.beforeEach(() => {
    /* Set suite-level Allure metadata during test runtime */
    allure.epic('Map Editing');
  });

  test.describe('Toolbar', () => {
    test.beforeEach(() => {
      /* Set group-level Allure metadata during test runtime */
      allure.feature('Toolbar');
    });

    test.describe('Open/Close Tools', () => {
      test.beforeEach(() => {
        allure.story('Open and close toolbar tools');
        allure.tag('e2e');
        allure.severity(allure.Severity.CRITICAL);
      });

      test('User can open and close each toolbar tool', async ({ page }) => {
        test.setTimeout(60000);
        const main = new MainPage(page);
        await main.goto();
        await main.expectMapVisible();

        await test.step('Open polyline tool and verify finish/cancel visible', async () => {
          await main.clickDrawPolyline();
          await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step('Open rectangle tool and verify finish/cancel visible', async () => {
          await main.clickDrawRectangle();
          await expect(page.getByRole('button', { name: /Finish|Cancel/i }).first()).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step('Open polygon tool and verify finish visible', async () => {
          await main.clickDrawPolygon();
          await expect(page.getByRole('button', { name: /Finish/i }).first()).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step('Open circle tool and verify cancel visible', async () => {
          await main.clickDrawCircle();
          await expect(page.getByRole('button', { name: /Cancel/i }).first()).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step('Open text tool and verify cancel visible', async () => {
          await main.clickDrawText();
          await expect(page.getByRole('button', { name: /Cancel/i }).first()).toBeVisible({
            timeout: 10000,
          });
        });
      });
    });
  });
});
