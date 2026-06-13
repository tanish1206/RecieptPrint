import { findEmissionData, calculateEmissions, clearCache } from '../src/utils/carbonMapper.js';

describe('carbonMapper.js Unit Tests', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('findEmissionData', () => {
    test('should match known item exactly (rice)', () => {
      const result = findEmissionData('rice');
      expect(result).toBeDefined();
      expect(result.name).toBe('rice');
      expect(result.co2_per_kg).toBe(2.5);
      expect(result.isFallback).toBe(false);
    });

    test('should match known item via alias (basmati -> rice)', () => {
      const result = findEmissionData('basmati');
      expect(result).toBeDefined();
      expect(result.name).toBe('rice');
      expect(result.isFallback).toBe(false);
    });

    test('should match case-insensitively and ignore whitespace', () => {
      const result = findEmissionData('  AsHiRvAaD aTtA  ');
      expect(result).toBeDefined();
      expect(result.name).toBe('wheat flour');
      expect(result.isFallback).toBe(false);
    });

    test('should return fallback for unknown items', () => {
      const result = findEmissionData('shampoo');
      expect(result).toBeDefined();
      expect(result.name).toBe('shampoo');
      expect(result.isFallback).toBe(true);
      expect(result.co2_per_kg).toBe(1.5);
    });

    test('should return fallback for empty or invalid names', () => {
      const result = findEmissionData('');
      expect(result.name).toBe('Unknown Item');
      expect(result.isFallback).toBe(true);
    });
  });

  describe('calculateEmissions', () => {
    test('should calculate correct emissions for known item', () => {
      // Rice: 2.5 co2_per_kg * 2 = 5.0
      const result = calculateEmissions('rice', 2, 'kg');
      expect(result.co2e).toBe(5.0);
      expect(result.matchedItem.isFallback).toBe(false);
    });

    test('should handle zero quantity and return zero emissions', () => {
      const result = calculateEmissions('rice', 0, 'kg');
      expect(result.co2e).toBe(0.0);
      expect(result.quantity).toBe(0);
    });

    test('should handle negative or invalid quantity and return zero emissions', () => {
      const result = calculateEmissions('rice', -5, 'kg');
      expect(result.co2e).toBe(0.0);
      
      const result2 = calculateEmissions('rice', 'invalid', 'kg');
      expect(result2.co2e).toBe(0.0);
    });

    test('should calculate emissions for unknown item using fallback factor', () => {
      // Fallback factor is 1.5. 1.5 * 3 = 4.5
      const result = calculateEmissions('some random item', 3, 'kg');
      expect(result.co2e).toBe(4.5);
      expect(result.matchedItem.isFallback).toBe(true);
    });

    test('should convert units from grams to kg', () => {
      // Rice: 2.5 co2_per_kg. 500g = 0.5kg -> 1.25 co2e
      const result = calculateEmissions('rice', 500, 'g');
      expect(result.co2e).toBe(1.25);
      expect(result.unit).toBe('g');
    });

    test('should convert units from ml to litre', () => {
      // Milk: 1.9 co2_per_kg. 500ml = 0.5l -> 0.95 co2e
      const result = calculateEmissions('milk', 500, 'ml');
      expect(result.co2e).toBe(0.95);
    });
  });
});
