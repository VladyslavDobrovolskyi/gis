import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@db': path.resolve(__dirname, '../../apps/backend/db'),
      '@gis/shared': path.resolve(__dirname, '../../packages/shared'),
      '@gis/shared/schemas': path.resolve(__dirname, '../../packages/shared/schemas'),
      '@gis/shared/types': path.resolve(__dirname, '../../packages/shared/types'),
    },
  },

  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg'],

  test: {
    globals: true,
    setupFiles: ['allure-vitest/setup', './tests/setupTests.ts'],
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
