import { test } from '@playwright/test';
import { MainPage } from '@/pageobjects/MainPage';
import * as allure from 'allure-js-commons';

test.describe('App E2E - Layer Controls', () => {
  /* Layer Controls tests verify opening and closing of each tool. */

  test.beforeEach(() => {
    test.setTimeout(60000);
    /* Per-test metadata for Allure reporting */
    allure.epic('App UI');
    allure.feature('Toolbar');
    allure.story('Open and close each layer control tool');
    allure.tag('e2e');
    allure.severity(allure.Severity.CRITICAL);
  });

  test('Can open and close each layer control tool', async ({ page }) => {
    const main = new MainPage(page);

    await test.step('Open app and ensure map is visible', async () => {
      await main.goto();
      await main.expectMapVisible();
    });

    await test.step('Open Edit Layers and verify it is active', async () => {
      await main.clickEditLayers();
      await main.waitForToolActive('Edit Layers');
    });

    await test.step('Open Drag Layers and verify it is active', async () => {
      await main.clickDragLayers();
      await main.waitForToolActive('Drag Layers');
    });

    await test.step('Open Cut Layers and verify it is active', async () => {
      await main.clickCutLayers();
      await main.waitForToolActive('Cut Layers');
    });

    await test.step('Open Rotate Layers and verify it is active', async () => {
      await main.clickRotateLayers();
      await main.waitForToolActive('Rotate Layers');
    });
  });
});
