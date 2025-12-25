import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node', // т.к. backend
  testMatch: ['<rootDir>/tests/**/*.test.ts'], // все тесты в папке tests
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  clearMocks: true,
  verbose: true,
};

export default config;
