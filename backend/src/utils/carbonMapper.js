import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the emissions dataset
const emissionsPath = path.join(__dirname, '..', 'data', 'emissions.json');
let emissionsDb = { items: [] };

try {
  const fileContent = fs.readFileSync(emissionsPath, 'utf8');
  emissionsDb = JSON.parse(fileContent);
} catch (error) {
  console.error('Failed to load emissions.json database. Using empty fallback.', error);
}

// In-memory cache for lookup results
const lookupCache = new Map();

// Helper to calculate string similarity (Levenshtein distance based coefficient)
function getSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) {
    // Substring match: score based on length ratio
    return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length) * 0.9;
  }
  
  // Basic token matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const intersection = words1.filter(w => words2.includes(w));
  if (intersection.length > 0) {
    return (intersection.length * 2) / (words1.length + words2.length) * 0.8;
  }
  
  return 0.0;
}

/**
 * Finds the emission entry for a given item name.
 * Uses exact match, alias match, or fuzzy matching.
 * Results are cached in memory.
 * @param {string} rawName 
 * @returns {object} The matched item from emissions.json or a fallback item.
 */
export function findEmissionData(rawName) {
  if (!rawName || typeof rawName !== 'string') {
    return getFallbackItem('Unknown Item');
  }

  const cleanName = rawName.toLowerCase().trim();

  // 1. Check cache first
  if (lookupCache.has(cleanName)) {
    return lookupCache.get(cleanName);
  }

  let bestMatch = null;
  let highestScore = 0.0;

  // 2. Iterate and match
  for (const item of emissionsDb.items) {
    // Exact or direct match on name
    if (item.name.toLowerCase() === cleanName) {
      bestMatch = item;
      highestScore = 1.0;
      break;
    }

    // Check similarity with the item name
    const nameScore = getSimilarity(cleanName, item.name);
    if (nameScore > highestScore) {
      highestScore = nameScore;
      bestMatch = item;
    }

    // Check aliases
    if (item.aliases && Array.isArray(item.aliases)) {
      for (const alias of item.aliases) {
        if (alias.toLowerCase() === cleanName) {
          bestMatch = item;
          highestScore = 1.0;
          break;
        }
        const aliasScore = getSimilarity(cleanName, alias);
        if (aliasScore > highestScore) {
          highestScore = aliasScore;
          bestMatch = item;
        }
      }
    }

    if (highestScore === 1.0) {
      break;
    }
  }

  // Define strict similarity threshold (e.g. 0.3)
  let result;
  if (bestMatch && highestScore >= 0.3) {
    result = { ...bestMatch, isFallback: false, matchScore: highestScore };
  } else {
    result = getFallbackItem(rawName);
  }

  // 3. Store in cache
  lookupCache.set(cleanName, result);
  return result;
}

/**
 * Returns a fallback item configuration.
 * @param {string} rawName 
 * @returns {object}
 */
function getFallbackItem(rawName) {
  return {
    name: rawName || 'Unknown Item',
    aliases: [],
    co2_per_kg: 1.5, // Average carbon footprint fallback
    category: 'misc',
    unit: 'kg',
    suggestions: [],
    isFallback: true,
    matchScore: 0
  };
}

/**
 * Calculates emissions for a given item, quantity, and unit.
 * Handles zero quantity and basic unit conversion.
 * @param {string} rawName 
 * @param {number} quantity 
 * @param {string} unit 
 * @returns {object} Object containing lookup info and total CO2e emissions in kg.
 */
export function calculateEmissions(rawName, quantity, unit) {
  const q = parseFloat(quantity);
  
  // Rule 13: Zero quantity returns zero emissions
  if (isNaN(q) || q <= 0) {
    const itemData = findEmissionData(rawName);
    return {
      item: itemData.name,
      matchedItem: itemData,
      quantity: 0,
      unit: unit || itemData.unit,
      co2e: 0.0
    };
  }

  const itemData = findEmissionData(rawName);
  let multiplier = 1.0;
  
  const targetUnit = (unit || '').toLowerCase().trim();
  const baseUnit = itemData.unit.toLowerCase();

  // Simple unit conversions
  // If base is 'kg' and input is grams
  if (baseUnit === 'kg' && (targetUnit === 'g' || targetUnit === 'gm' || targetUnit === 'gram' || targetUnit === 'grams')) {
    multiplier = 0.001;
  }
  // If base is 'litre' (or liter) and input is ml
  else if ((baseUnit === 'litre' || baseUnit === 'liter' || baseUnit === 'l') && (targetUnit === 'ml' || targetUnit === 'milliliter' || targetUnit === 'millilitres')) {
    multiplier = 0.001;
  }

  const totalEmissions = q * multiplier * itemData.co2_per_kg;

  return {
    item: rawName,
    matchedItem: {
      name: itemData.name,
      category: itemData.category,
      co2_per_kg: itemData.co2_per_kg,
      suggestions: itemData.suggestions,
      isFallback: itemData.isFallback
    },
    quantity: q,
    unit: unit || itemData.unit,
    co2e: Math.round(totalEmissions * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Clears the lookup cache (useful for testing).
 */
export function clearCache() {
  lookupCache.clear();
}
