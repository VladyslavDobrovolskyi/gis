import { test, expect } from '@playwright/test';
import { MainPage } from '@/pageobjects/MainPage';
import * as allure from 'allure-js-commons';

/* Moved to beforeEach */

test.describe('App E2E - Polygon Drawing', () => {
  /* Moved to beforeEach */

  test.beforeEach(() => {
    /* Per-test Allure metadata set during the test runtime */
    allure.epic('Map Editing');
    allure.feature('Drawing');
    allure.story('Activate polygon draw mode');
    allure.tag('e2e');
    allure.severity(allure.Severity.CRITICAL);
  });

  test('User can activate polygon draw mode', async ({ page }) => {
    const main = new MainPage(page);
    await test.step('Open app and ensure map is visible', async () => {
      await main.goto();
      await main.expectMapVisible();
    });
    await test.step('Activate polygon draw tool', async () => {
      await main.clickDrawPolygon();
    });
    await test.step('Verify Finish button is visible', async () => {
      await expect(page.getByRole('button', { name: /Finish/i }).first()).toBeVisible();
    });
  });
});
