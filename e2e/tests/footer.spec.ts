import { test, expect, Locator } from '@playwright/test';
import { MainPage } from '../pageobjects/MainPage';
import * as allure from 'allure-js-commons';

/* Footer tests verify the footer contains required attribution links and author information.
   These elements are stable UI features and should remain visible across builds. */
test.describe('App E2E - Footer', () => {
  test.beforeEach(() => {
    allure.epic('App UI');
    allure.feature('Footer');
    allure.story('Footer content and attributions');
    allure.tag('e2e');
    allure.severity(allure.Severity.NORMAL);
  });

  test('Footer contains Leaflet link and author name', async ({ page }) => {
    const main = new MainPage(page);

    await test.step('Open app and ensure map is visible', async () => {
      await main.goto();
      await main.expectMapVisible();
    });

    await test.step('Verify footer links and author', async () => {
      const leafletLink: Locator = page.getByRole('link', { name: /Leaflet/i });
      const osmText: Locator = page.getByText(/OpenStreetMap contributors/);
      const authorText: Locator = page.getByText(/Vladyslav Dobrovolskyi/);

      await expect(leafletLink).toBeVisible();
      await expect(osmText).toBeVisible();
      await expect(authorText).toBeVisible();

      /* Attach a small footer snippet for Allure traceability */
      test.info().attach('footer-snippet.txt', {
        body: `${(await leafletLink.textContent()) ?? ''}\n${(await osmText.textContent()) ?? ''}\n${(await authorText.textContent()) ?? ''}`,
        contentType: 'text/plain',
      });
    });
  });
});
