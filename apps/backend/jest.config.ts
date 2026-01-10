import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const tsconfig = require('./tsconfig.json');

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'allure-jest/node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  clearMocks: true,
  verbose: true,
  reporters: ['default'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),

    '^@/(.*)$': '<rootDir>/src/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@queries/(.*)$': '<rootDir>/db/sql/$1',
    '^@generated/(.*)$': '<rootDir>/db/generated/$1',
    '^@docs/(.*)$': '<rootDir>/docs/$1',
    '^@trpc$': '<rootDir>/src/trpc',

    '^@gis/shared/schemas$': '<rootDir>/../../packages/shared/schemas/index.ts',
    '^@gis/shared/(.*)$': '<rootDir>/../../packages/shared/$1',
  },

  transformIgnorePatterns: ['node_modules/(?!(@gis/shared|@db)/)'],

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json', useESM: false }],
  },

  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
};

export default config;
