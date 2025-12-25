import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginZodOpenApi from 'eslint-plugin-zod-openapi';

export default [
  // -----------------------
  // Common configuration for all files
  // -----------------------
  {
    files: ['**/*.{js,ts,vue}'],
    rules: {
      'no-unused-vars': 'warn',
      semi: ['error', 'always'],
    },
  },

  // -----------------------
  // Express backend (Node.js)
  // -----------------------
  {
    files: ['apps/backend/**/*.{js,ts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // -----------------------
  // Vue frontend (Vue 3 + TS)
  // -----------------------
  {
    files: ['apps/frontend/**/*.{js,ts,vue}'],
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': tsEslint,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...pluginVue.configs['flat/recommended'].rules,
      ...tsEslint.configs.recommended.rules,
    },
  },
  // -----------------------
  // Shared package (types, zod schemas)
  // -----------------------
  {
    files: ['packages/shared/**/*.{ts,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      'eslint-plugin-zod-openapi': pluginZodOpenApi,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,

      // практичные послабления для shared
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // -----------------------
  // Prettier integration
  // -----------------------
  eslintConfigPrettier,
];
