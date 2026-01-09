import { describe, it, expect } from '@jest/globals';
import * as allure from 'allure-js-commons';

describe('Sample Backend Test', () => {
  it('should add numbers correctly', () => {
    // Example labels for Allure (Epic / Feature / Severity)
    allure.epic('Math Utilities');
    allure.feature('Addition');
    allure.severity('Minor');

    const sum = 1 + 2;
    expect(sum).toBe(3);
  });

  // it('should throw PostGIS error', () => {
  //   allure.epic('GIS');
  //   allure.feature('PostGIS');
  //   allure.severity('Critical');
  //   // Симуляция ошибки PostGIS
  //   throw new Error('PostGIS error: invalid geometry SRID');
  // });
});
