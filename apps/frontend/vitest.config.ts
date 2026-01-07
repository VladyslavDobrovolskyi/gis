import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],

  test: {
    globals: true,
    setupFiles: ['allure-vitest/setup'],
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    reporters: [
      'default',
      ['allure-vitest/reporter', { outputDir: 'apps/frontend/allure-results' }],
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  logLevel: 'error',
});
