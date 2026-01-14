import { test, expect, type Page } from '@playwright/test';
import { MainPage } from '../pageobjects/MainPage';
import * as allure from 'allure-js-commons';

test.describe('App E2E - Smoke', () => {
  test.beforeEach(() => {
    allure.epic('Application');
    allure.feature('Smoke');
    allure.story('Smoke tests');
    allure.tag('e2e');
    allure.severity(allure.Severity.NORMAL);
  });
  test('Home page renders and map is visible', async ({ page }: { page: Page }) => {
    const main = new MainPage(page);
    await test.step('Open home page', async () => {
      await main.goto();
    });
    await test.step('Assert map is visible', async () => {
      await main.expectMapVisible();
    });
  });

  test('No console errors on load', async ({ page }: { page: Page }) => {
    const errors: string[] = [];

    /* Capture page errors and console.error messages */
    page.on('pageerror', (err: Error) => {
      errors.push(err?.message ?? String(err));
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const main = new MainPage(page);
    await test.step('Open home page and wait for map', async () => {
      await main.goto();
      await main.expectMapVisible();
    });

    await test.step('Assert no console errors were emitted', async () => {
      expect(errors).toHaveLength(0);
    });
  });
});
