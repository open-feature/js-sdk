/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  displayName: 'angular',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  testMatch: ['<rootDir>/projects/angular-sdk/src/**/*.spec.{ts,tsx}'],
  moduleNameMapper: {
    '@openfeature/core': '<rootDir>/../shared/src',
    '@openfeature/web-sdk': '<rootDir>/../web/src',
  },
};

export default config;
