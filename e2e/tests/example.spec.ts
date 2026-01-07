import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

test('has title', async ({ page }) => {
  allure.epic('E2E');
  allure.feature('Playwright');
  allure.severity('Normal');
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});
test('get started link', async ({ page }) => {
  allure.epic('E2E');
  allure.feature('Playwright');
  allure.severity('Normal');
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('should fail playwright navigation', async ({ page }) => {
  allure.epic('E2E');
  allure.feature('Playwright');
  allure.severity('Critical');
  throw new Error('playwright: page.goto target closed');
});
