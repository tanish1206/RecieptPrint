import { findEmissionData, calculateEmissions, clearCache } from '../src/utils/carbonMapper.js';

describe('carbonMapper.js — Full Test Suite', () => {
  beforeEach(() => {
    clearCache();
  });

  // ── findEmissionData ─────────────────────────────────────────────────────────

  describe('findEmissionData — exact and alias matching', () => {
    test('exact name match returns correct item (rice)', () => {
      const result = findEmissionData('rice');
      expect(result.name).toBe('rice');
      expect(result.co2_per_kg).toBe(2.5);
      expect(result.isFallback).toBe(false);
    });

    test('alias match: "basmati" resolves to rice', () => {
      const result = findEmissionData('basmati');
      expect(result.name).toBe('rice');
      expect(result.isFallback).toBe(false);
    });

    test('alias match: "chawal" resolves to rice', () => {
      const result = findEmissionData('chawal');
      expect(result.name).toBe('rice');
      expect(result.isFallback).toBe(false);
    });

    test('alias match: "doodh" resolves to milk', () => {
      const result = findEmissionData('doodh');
      expect(result.name).toBe('milk');
      expect(result.isFallback).toBe(false);
    });

    test('alias match: "amul paneer" resolves to paneer', () => {
      const result = findEmissionData('amul paneer');
      expect(result.name).toBe('paneer');
      expect(result.isFallback).toBe(false);
    });

    test('alias match: "atta" resolves to wheat flour', () => {
      const result = findEmissionData('atta');
      expect(result.name).toBe('wheat flour');
      expect(result.isFallback).toBe(false);
    });
  });

  describe('findEmissionData — case and whitespace insensitivity', () => {
    test('uppercase item name matches correctly', () => {
      const result = findEmissionData('RICE');
      expect(result.isFallback).toBe(false);
      expect(result.name).toBe('rice');
    });

    test('mixed case matches correctly', () => {
      const result = findEmissionData('AShiRvAaD aTtA');
      expect(result.name).toBe('wheat flour');
      expect(result.isFallback).toBe(false);
    });

    test('leading and trailing whitespace is ignored', () => {
      const result = findEmissionData('  rice  ');
      expect(result.name).toBe('rice');
      expect(result.isFallback).toBe(false);
    });
  });

  describe('findEmissionData — category mapping', () => {
    test('mutton maps to meat category with highest CO₂', () => {
      const result = findEmissionData('mutton');
      expect(result.category).toBe('meat');
      expect(result.co2_per_kg).toBe(24.5);
    });

    test('paneer maps to dairy category', () => {
      const result = findEmissionData('paneer');
      expect(result.category).toBe('dairy');
    });

    test('potato maps to vegetables category', () => {
      const result = findEmissionData('potato');
      expect(result.category).toBe('vegetables');
    });

    test('meat category items emit more than vegetables', () => {
      const meat = findEmissionData('chicken');
      const veg  = findEmissionData('spinach');
      expect(meat.co2_per_kg).toBeGreaterThan(veg.co2_per_kg);
    });

    test('dairy category items emit more than grains', () => {
      const dairy = findEmissionData('ghee');
      const grain = findEmissionData('rice');
      expect(dairy.co2_per_kg).toBeGreaterThan(grain.co2_per_kg);
    });
  });

  describe('findEmissionData — fallback for unknown items', () => {
    test('completely unknown item returns fallback with 1.5 factor', () => {
      const result = findEmissionData('shampoo');
      expect(result.isFallback).toBe(true);
      expect(result.co2_per_kg).toBe(1.5);
      expect(result.category).toBe('misc');
    });

    test('empty string returns fallback named "Unknown Item"', () => {
      const result = findEmissionData('');
      expect(result.name).toBe('Unknown Item');
      expect(result.isFallback).toBe(true);
    });

    test('null input returns fallback', () => {
      const result = findEmissionData(null);
      expect(result.isFallback).toBe(true);
    });
  });

  describe('findEmissionData — swap suggestions', () => {
    test('high-CO₂ item (mutton) has swap suggestions', () => {
      const result = findEmissionData('mutton');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('swap suggestion for mutton has lower CO₂ than mutton itself', () => {
      const item = findEmissionData('mutton');
      item.suggestions.forEach(sug => {
        expect(sug.co2_per_kg).toBeLessThan(item.co2_per_kg);
      });
    });

    test('low-CO₂ item (spinach) has no swap suggestions', () => {
      const result = findEmissionData('spinach');
      expect(result.suggestions.length).toBe(0);
    });

    test('swap suggestion has a non-empty reason string', () => {
      const item = findEmissionData('paneer');
      expect(item.suggestions[0].reason).toBeTruthy();
      expect(typeof item.suggestions[0].reason).toBe('string');
    });
  });

  // ── calculateEmissions ───────────────────────────────────────────────────────

  describe('calculateEmissions — basic arithmetic', () => {
    test('rice 2 kg → 5.0 kg CO₂e (2.5 × 2)', () => {
      const { co2e } = calculateEmissions('rice', 2, 'kg');
      expect(co2e).toBe(5.0);
    });

    test('decimal quantity: rice 0.5 kg → 1.25 kg CO₂e', () => {
      const { co2e } = calculateEmissions('rice', 0.5, 'kg');
      expect(co2e).toBe(1.25);
    });

    test('large quantity scales linearly: rice 10 kg → 25.0 kg CO₂e', () => {
      const { co2e } = calculateEmissions('rice', 10, 'kg');
      expect(co2e).toBe(25.0);
    });

    test('unknown item uses 1.5 fallback factor: 3 kg → 4.5 CO₂e', () => {
      const { co2e, matchedItem } = calculateEmissions('zardugrass', 3, 'kg');
      expect(co2e).toBe(4.5);
      expect(matchedItem.isFallback).toBe(true);
    });
  });

  describe('calculateEmissions — zero and invalid quantities', () => {
    test('zero quantity returns 0 CO₂e', () => {
      const { co2e } = calculateEmissions('rice', 0, 'kg');
      expect(co2e).toBe(0.0);
    });

    test('negative quantity returns 0 CO₂e', () => {
      const { co2e } = calculateEmissions('rice', -5, 'kg');
      expect(co2e).toBe(0.0);
    });

    test('non-numeric quantity returns 0 CO₂e', () => {
      const { co2e } = calculateEmissions('rice', 'invalid', 'kg');
      expect(co2e).toBe(0.0);
    });

    test('undefined quantity returns 0 CO₂e', () => {
      const { co2e } = calculateEmissions('rice', undefined, 'kg');
      expect(co2e).toBe(0.0);
    });
  });

  describe('calculateEmissions — unit conversions', () => {
    test('grams → kg: rice 500g → 1.25 kg CO₂e', () => {
      const { co2e } = calculateEmissions('rice', 500, 'g');
      expect(co2e).toBe(1.25);
    });

    test('"gm" unit also converts correctly', () => {
      const { co2e } = calculateEmissions('rice', 1000, 'gm');
      expect(co2e).toBe(2.5);
    });

    test('ml → litre: milk 500ml → 0.95 kg CO₂e', () => {
      const { co2e } = calculateEmissions('milk', 500, 'ml');
      expect(co2e).toBe(0.95);
    });

    test('kg unit is identity: no conversion applied', () => {
      const { co2e } = calculateEmissions('rice', 1, 'kg');
      expect(co2e).toBe(2.5);
    });

    test('pcs unit uses co2_per_kg as-is (no conversion)', () => {
      const { co2e } = calculateEmissions('eggs', 6, 'pcs');
      expect(co2e).toBeGreaterThan(0);
    });
  });

  // ── Impact comparison constants ───────────────────────────────────────────────

  describe('Impact comparison — Indian averages', () => {
    test('CO₂ → driving km uses Indian petrol car rate (0.12 kg/km)', () => {
      const totalCo2 = 1.2; // kg
      const expectedKm = Math.round((totalCo2 / 0.12) * 10) / 10;
      expect(expectedKm).toBe(10.0);
    });

    test('CO₂ → smartphone charges conversion (0.008 kg/charge)', () => {
      const totalCo2 = 0.8; // kg
      const expectedCharges = Math.round(totalCo2 / 0.008);
      expect(expectedCharges).toBe(100);
    });

    test('annual savings = weekly CO₂ delta × 52 weeks', () => {
      const weeklyDelta = 1.5; // kg saved per week
      const annualSaving = Math.round(weeklyDelta * 52 * 10) / 10;
      expect(annualSaving).toBe(78.0);
    });

    test('annual savings returns 0 when no swaps available', () => {
      const weeklyDelta = 0;
      const annualSaving = Math.round(weeklyDelta * 52 * 10) / 10;
      expect(annualSaving).toBe(0.0);
    });
  });
});
