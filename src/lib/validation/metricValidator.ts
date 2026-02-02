/**
 * Metric Validation System
 *
 * This module validates LLM-generated sustainability metrics against
 * known bounds and scientific data to catch hallucinations.
 */

// Scientific bounds for validation (based on EPA, USGS, DOE data)
export const METRIC_BOUNDS = {
  // CO2 emissions per action type (kg)
  co2: {
    transport: { min: 0, max: 50 },      // Max ~100 mile drive
    food: { min: 0, max: 20 },           // Max full day's food
    energy: { min: 0, max: 30 },         // Max large appliance day
    water: { min: 0, max: 5 },           // Indirect CO2 from water
    waste: { min: 0, max: 5 },           // Composting/recycling
  },
  // Water savings (liters)
  water: {
    transport: { min: 0, max: 100 },     // Car wash avoided
    food: { min: 0, max: 5000 },         // Full day meatless (indirect)
    energy: { min: 0, max: 500 },        // Power plant water
    water: { min: 0, max: 500 },         // Direct water saving
    waste: { min: 0, max: 100 },
  },
  // Energy savings (kWh)
  energy: {
    transport: { min: 0, max: 10 },
    food: { min: 0, max: 5 },
    energy: { min: 0, max: 50 },         // Large appliance
    water: { min: 0, max: 20 },          // Water heating
    waste: { min: 0, max: 5 },
  },
};

// Conversion factors for cross-validation
export const CONVERSION_FACTORS = {
  co2PerMile: 0.404,                     // kg CO2 per car mile
  co2PerKwh: 0.42,                       // kg CO2 per kWh (US avg)
  co2PerLiterWater: 0.0003,              // kg CO2 per liter water
  co2PerKgMeat: 27,                      // kg CO2 per kg beef
  waterPerKgMeat: 15400,                 // liters per kg beef
  treesPerTonCO2: 45.8,                  // trees needed to absorb 1 ton CO2/year
};

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  errors: string[];
  adjustedMetrics?: {
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
  };
}

export interface MetricInput {
  co2Kg: number;
  waterLiters: number;
  energyKwh: number;
  treesEquivalent: number;
  category: string;
  userDescription?: string;
}

/**
 * Validates LLM-generated metrics against scientific bounds
 */
export function validateMetrics(
  metrics: MetricInput,
  baseMetrics: MetricInput
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let isValid = true;

  const category = metrics.category as keyof typeof METRIC_BOUNDS.co2;
  const bounds = {
    co2: METRIC_BOUNDS.co2[category] || METRIC_BOUNDS.co2.transport,
    water: METRIC_BOUNDS.water[category] || METRIC_BOUNDS.water.transport,
    energy: METRIC_BOUNDS.energy[category] || METRIC_BOUNDS.energy.transport,
  };

  // 1. Check if metrics are within bounds
  if (metrics.co2Kg < bounds.co2.min || metrics.co2Kg > bounds.co2.max) {
    errors.push(`CO2 (${metrics.co2Kg}kg) outside valid range [${bounds.co2.min}-${bounds.co2.max}]`);
    isValid = false;
  }

  if (metrics.waterLiters < bounds.water.min || metrics.waterLiters > bounds.water.max) {
    errors.push(`Water (${metrics.waterLiters}L) outside valid range [${bounds.water.min}-${bounds.water.max}]`);
    isValid = false;
  }

  if (metrics.energyKwh < bounds.energy.min || metrics.energyKwh > bounds.energy.max) {
    errors.push(`Energy (${metrics.energyKwh}kWh) outside valid range [${bounds.energy.min}-${bounds.energy.max}]`);
    isValid = false;
  }

  // 2. Check for unreasonable deviations from base metrics (>5x is suspicious)
  const co2Ratio = metrics.co2Kg / (baseMetrics.co2Kg || 0.1);
  const waterRatio = metrics.waterLiters / (baseMetrics.waterLiters || 0.1);
  const energyRatio = metrics.energyKwh / (baseMetrics.energyKwh || 0.1);

  if (co2Ratio > 5 || co2Ratio < 0.1) {
    warnings.push(`CO2 changed by ${co2Ratio.toFixed(1)}x from base - verify with user`);
  }

  if (waterRatio > 5 || waterRatio < 0.1) {
    warnings.push(`Water changed by ${waterRatio.toFixed(1)}x from base - verify with user`);
  }

  if (energyRatio > 5 || energyRatio < 0.1) {
    warnings.push(`Energy changed by ${energyRatio.toFixed(1)}x from base - verify with user`);
  }

  // 3. Cross-validate trees equivalent
  const expectedTrees = metrics.co2Kg / (CONVERSION_FACTORS.treesPerTonCO2 * 1000 / 1000);
  const treesRatio = metrics.treesEquivalent / (expectedTrees || 0.001);

  if (treesRatio > 2 || treesRatio < 0.5) {
    warnings.push(`Trees equivalent (${metrics.treesEquivalent}) doesn't match CO2 savings - expected ~${expectedTrees.toFixed(3)}`);
  }

  // 4. Calculate confidence based on validation results
  let confidence = 1.0;
  confidence -= errors.length * 0.3;
  confidence -= warnings.length * 0.1;
  confidence = Math.max(0, Math.min(1, confidence));

  // 5. If invalid, suggest adjusted metrics
  let adjustedMetrics;
  if (!isValid) {
    adjustedMetrics = {
      co2Kg: Math.max(bounds.co2.min, Math.min(bounds.co2.max, metrics.co2Kg)),
      waterLiters: Math.max(bounds.water.min, Math.min(bounds.water.max, metrics.waterLiters)),
      energyKwh: Math.max(bounds.energy.min, Math.min(bounds.energy.max, metrics.energyKwh)),
    };
  }

  return {
    isValid,
    confidence,
    warnings,
    errors,
    adjustedMetrics,
  };
}

/**
 * Extracts numeric values from user description for cross-validation
 * E.g., "biked 15 miles" -> { distance: 15, unit: 'miles' }
 */
export function extractQuantitiesFromDescription(description: string): {
  distance?: { value: number; unit: string };
  duration?: { value: number; unit: string };
  quantity?: { value: number; unit: string };
} {
  const result: ReturnType<typeof extractQuantitiesFromDescription> = {};

  // Distance patterns
  const distanceMatch = description.match(/(\d+(?:\.\d+)?)\s*(miles?|km|kilometers?|mi)/i);
  if (distanceMatch) {
    result.distance = {
      value: parseFloat(distanceMatch[1]),
      unit: distanceMatch[2].toLowerCase(),
    };
  }

  // Duration patterns
  const durationMatch = description.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?)/i);
  if (durationMatch) {
    result.duration = {
      value: parseFloat(durationMatch[1]),
      unit: durationMatch[2].toLowerCase(),
    };
  }

  // Quantity patterns
  const quantityMatch = description.match(/(\d+(?:\.\d+)?)\s*(meals?|loads?|bags?|items?|times?)/i);
  if (quantityMatch) {
    result.quantity = {
      value: parseFloat(quantityMatch[1]),
      unit: quantityMatch[2].toLowerCase(),
    };
  }

  return result;
}

/**
 * Validates that LLM metrics are consistent with extracted quantities
 */
export function validateAgainstDescription(
  metrics: MetricInput,
  baseMetrics: MetricInput,
  description: string
): ValidationResult {
  const baseResult = validateMetrics(metrics, baseMetrics);
  const quantities = extractQuantitiesFromDescription(description);

  // If we found a distance and this is transport category
  if (quantities.distance && metrics.category === 'transport') {
    let distanceKm = quantities.distance.value;
    if (quantities.distance.unit.includes('mile')) {
      distanceKm *= 1.609; // Convert to km
    }

    // Expected CO2 for this distance (avg car)
    const expectedCO2 = distanceKm * 0.251; // kg CO2 per km
    const ratio = metrics.co2Kg / expectedCO2;

    if (ratio < 0.5 || ratio > 2) {
      baseResult.warnings.push(
        `User mentioned ${quantities.distance.value} ${quantities.distance.unit}, ` +
        `expected ~${expectedCO2.toFixed(1)}kg CO2, got ${metrics.co2Kg.toFixed(1)}kg`
      );
      baseResult.confidence *= 0.8;
    }
  }

  return baseResult;
}
