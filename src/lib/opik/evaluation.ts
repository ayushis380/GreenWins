/**
 * Opik Evaluation System for Sustainability Metrics
 *
 * Uses Opik's built-in evaluate() function with custom metrics
 * to assess LLM-generated sustainability impact values.
 */

import { evaluate, BaseMetric, Opik, EvaluationTask, z } from 'opik';
import { PREDEFINED_ACTIONS } from '@/lib/constants';
import { METRIC_BOUNDS } from '@/lib/validation/metricValidator';

// Dataset item type for sustainability metrics evaluation
export interface SustainabilityDatasetItem {
  input: {
    actionName: string;
    actionCategory: string;
    actionDescription: string;
    userDescription: string;
    baseImpactMetrics: {
      co2Kg: number;
      waterLiters: number;
      energyKwh: number;
      treesEquivalent: number;
    };
  };
  expected_output: {
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
    treesEquivalent: number;
  };
  metadata: {
    id: string;
    tolerance: number;
  };
}

// Zod schema for sustainability metric scoring
const sustainabilityScoreSchema = z.object({
  output: z.object({
    co2Kg: z.number(),
    waterLiters: z.number(),
    energyKwh: z.number(),
    treesEquivalent: z.number(),
  }),
  expected: z.object({
    co2Kg: z.number(),
    waterLiters: z.number(),
    energyKwh: z.number(),
    treesEquivalent: z.number(),
  }),
  tolerance: z.number(),
  category: z.string(),
});

type SustainabilityScoreInput = z.infer<typeof sustainabilityScoreSchema>;

/**
 * Custom Metric: CO2 Accuracy
 */
class CO2AccuracyMetric extends BaseMetric<typeof sustainabilityScoreSchema> {
  readonly validationSchema = sustainabilityScoreSchema;

  constructor() {
    super('co2_accuracy', true);
  }

  score(input: unknown) {
    const data = input as SustainabilityScoreInput;
    const expected = data.expected.co2Kg;
    const actual = data.output.co2Kg;
    const tolerance = data.tolerance;

    const diff = Math.abs(actual - expected);
    const allowedDiff = expected * tolerance;

    if (diff <= allowedDiff) {
      return { name: this.name, value: 1, reason: `CO2 within ${(tolerance * 100).toFixed(0)}% tolerance` };
    }

    const value = Math.max(0, 1 - (diff - allowedDiff) / Math.max(expected, 0.01));
    return {
      name: this.name,
      value,
      reason: `CO2 ${actual.toFixed(2)}kg vs expected ${expected.toFixed(2)}kg (${((diff / Math.max(expected, 0.01)) * 100).toFixed(1)}% off)`,
    };
  }
}

/**
 * Custom Metric: Water Accuracy
 */
class WaterAccuracyMetric extends BaseMetric<typeof sustainabilityScoreSchema> {
  readonly validationSchema = sustainabilityScoreSchema;

  constructor() {
    super('water_accuracy', true);
  }

  score(input: unknown) {
    const data = input as SustainabilityScoreInput;
    const expected = data.expected.waterLiters;
    const actual = data.output.waterLiters;
    const tolerance = data.tolerance;

    if (expected === 0) {
      return actual <= 10
        ? { name: this.name, value: 1, reason: 'Water correctly near zero' }
        : { name: this.name, value: 0, reason: `Water ${actual}L should be ~0` };
    }

    const diff = Math.abs(actual - expected);
    const allowedDiff = expected * tolerance;

    if (diff <= allowedDiff) {
      return { name: this.name, value: 1, reason: `Water within ${(tolerance * 100).toFixed(0)}% tolerance` };
    }

    const value = Math.max(0, 1 - (diff - allowedDiff) / expected);
    return { name: this.name, value, reason: `Water ${actual}L vs expected ${expected}L` };
  }
}

/**
 * Custom Metric: Energy Accuracy
 */
class EnergyAccuracyMetric extends BaseMetric<typeof sustainabilityScoreSchema> {
  readonly validationSchema = sustainabilityScoreSchema;

  constructor() {
    super('energy_accuracy', true);
  }

  score(input: unknown) {
    const data = input as SustainabilityScoreInput;
    const expected = data.expected.energyKwh;
    const actual = data.output.energyKwh;
    const tolerance = data.tolerance;

    if (expected === 0) {
      return actual <= 0.5
        ? { name: this.name, value: 1, reason: 'Energy correctly near zero' }
        : { name: this.name, value: 0, reason: `Energy ${actual}kWh should be ~0` };
    }

    const diff = Math.abs(actual - expected);
    const allowedDiff = expected * tolerance;

    if (diff <= allowedDiff) {
      return { name: this.name, value: 1, reason: `Energy within ${(tolerance * 100).toFixed(0)}% tolerance` };
    }

    const value = Math.max(0, 1 - (diff - allowedDiff) / expected);
    return { name: this.name, value, reason: `Energy ${actual.toFixed(2)}kWh vs expected ${expected.toFixed(2)}kWh` };
  }
}

/**
 * Custom Metric: Bounds Compliance
 */
class BoundsComplianceMetric extends BaseMetric<typeof sustainabilityScoreSchema> {
  readonly validationSchema = sustainabilityScoreSchema;

  constructor() {
    super('bounds_compliance', true);
  }

  score(input: unknown) {
    const data = input as SustainabilityScoreInput;
    const category = data.category as keyof typeof METRIC_BOUNDS.co2;
    const bounds = {
      co2: METRIC_BOUNDS.co2[category] || METRIC_BOUNDS.co2.transport,
      water: METRIC_BOUNDS.water[category] || METRIC_BOUNDS.water.transport,
      energy: METRIC_BOUNDS.energy[category] || METRIC_BOUNDS.energy.transport,
    };

    const violations: string[] = [];
    const output = data.output;

    if (output.co2Kg < bounds.co2.min || output.co2Kg > bounds.co2.max) {
      violations.push(`CO2 ${output.co2Kg}kg outside [${bounds.co2.min}-${bounds.co2.max}]`);
    }
    if (output.waterLiters < bounds.water.min || output.waterLiters > bounds.water.max) {
      violations.push(`Water ${output.waterLiters}L outside [${bounds.water.min}-${bounds.water.max}]`);
    }
    if (output.energyKwh < bounds.energy.min || output.energyKwh > bounds.energy.max) {
      violations.push(`Energy ${output.energyKwh}kWh outside [${bounds.energy.min}-${bounds.energy.max}]`);
    }

    const value = 1 - violations.length / 3;
    return {
      name: this.name,
      value,
      reason: violations.length > 0 ? violations.join('; ') : 'All metrics within scientific bounds',
    };
  }
}

/**
 * Custom Metric: Overall Accuracy (weighted average)
 */
class OverallAccuracyMetric extends BaseMetric<typeof sustainabilityScoreSchema> {
  readonly validationSchema = sustainabilityScoreSchema;

  constructor() {
    super('overall_accuracy', true);
  }

  score(input: unknown) {
    const co2Metric = new CO2AccuracyMetric();
    const waterMetric = new WaterAccuracyMetric();
    const energyMetric = new EnergyAccuracyMetric();

    const co2Score = co2Metric.score(input);
    const waterScore = waterMetric.score(input);
    const energyScore = energyMetric.score(input);

    // Weighted average: CO2 50%, Water 25%, Energy 25%
    const overall = co2Score.value * 0.5 + waterScore.value * 0.25 + energyScore.value * 0.25;

    return {
      name: this.name,
      value: overall,
      reason: `CO2: ${(co2Score.value * 100).toFixed(0)}%, Water: ${(waterScore.value * 100).toFixed(0)}%, Energy: ${(energyScore.value * 100).toFixed(0)}%`,
    };
  }
}

// User descriptions for each test case
const TEST_CASES: Array<{
  id: string;
  actionName: string;
  category: string;
  userDescription: string;
  expected: { co2Kg: number; waterLiters: number; energyKwh: number; treesEquivalent: number };
  tolerance: number;
}> = [
  { id: 'bike-5-miles', actionName: 'Bike Commute', category: 'transport', userDescription: 'Biked 5 miles to work instead of driving', expected: { co2Kg: 2.02, waterLiters: 0, energyKwh: 0, treesEquivalent: 0.093 }, tolerance: 0.3 },
  { id: 'bike-10-miles', actionName: 'Bike Commute', category: 'transport', userDescription: 'Cycled 10 miles round trip to the office', expected: { co2Kg: 4.04, waterLiters: 0, energyKwh: 0, treesEquivalent: 0.185 }, tolerance: 0.3 },
  { id: 'meatless-lunch', actionName: 'Meatless Meal', category: 'food', userDescription: 'Had a vegetarian lunch instead of a beef burger', expected: { co2Kg: 3.0, waterLiters: 1700, energyKwh: 0.5, treesEquivalent: 0.14 }, tolerance: 0.4 },
  { id: 'meatless-full-day', actionName: 'Meatless Meal', category: 'food', userDescription: 'Went fully vegetarian for the entire day, all 3 meals', expected: { co2Kg: 7.5, waterLiters: 4500, energyKwh: 1.5, treesEquivalent: 0.34 }, tolerance: 0.4 },
  { id: 'shower-5min', actionName: 'Shorter Shower', category: 'water', userDescription: 'Took a 5 minute shower instead of my usual 10 minutes', expected: { co2Kg: 0.5, waterLiters: 40, energyKwh: 1.5, treesEquivalent: 0.02 }, tolerance: 0.3 },
  { id: 'line-dry-load', actionName: 'Line Dry Clothes', category: 'energy', userDescription: 'Line dried one full load of laundry in the sun', expected: { co2Kg: 2.4, waterLiters: 0, energyKwh: 3.0, treesEquivalent: 0.11 }, tolerance: 0.25 },
  { id: 'bus-commute', actionName: 'Public Transport', category: 'transport', userDescription: 'Took the bus 15 miles to work', expected: { co2Kg: 4.5, waterLiters: 0, energyKwh: 0, treesEquivalent: 0.21 }, tolerance: 0.35 },
  { id: 'compost-week', actionName: 'Composted', category: 'waste', userDescription: 'Composted all food scraps from cooking dinner', expected: { co2Kg: 0.4, waterLiters: 5, energyKwh: 0, treesEquivalent: 0.02 }, tolerance: 0.4 },
  { id: 'cold-wash-large', actionName: 'Cold Water Wash', category: 'energy', userDescription: 'Washed 2 large loads of laundry in cold water', expected: { co2Kg: 1.2, waterLiters: 0, energyKwh: 1.6, treesEquivalent: 0.06 }, tolerance: 0.3 },
  { id: 'unplug-devices', actionName: 'Unplugged Devices', category: 'energy', userDescription: 'Unplugged all electronics overnight including TV, computer, and chargers', expected: { co2Kg: 0.3, waterLiters: 0, energyKwh: 0.5, treesEquivalent: 0.01 }, tolerance: 0.4 },
];

/**
 * Build dataset items for Opik
 */
export function buildDatasetItems() {
  return TEST_CASES.map(tc => {
    const baseAction = PREDEFINED_ACTIONS.find(a => a.name === tc.actionName);
    return {
      input: {
        actionName: tc.actionName,
        actionCategory: tc.category,
        actionDescription: baseAction?.description || '',
        userDescription: tc.userDescription,
        baseImpactMetrics: baseAction?.impactMetrics || { co2Kg: 0, waterLiters: 0, energyKwh: 0, treesEquivalent: 0 },
      },
      expected_output: tc.expected,
      metadata: { id: tc.id, tolerance: tc.tolerance },
    };
  });
}

// Export test cases for backward compatibility
export const EVALUATION_DATASET = TEST_CASES;

/**
 * Run evaluation using Opik's evaluate() function
 */
export async function runOpikEvaluation(
  analyzeFunction: (input: SustainabilityDatasetItem['input']) => Promise<{
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
    treesEquivalent: number;
    confidence: number;
    methodology: string;
  }>,
  options?: { experimentName?: string; projectName?: string }
) {
  const apiKey = process.env.OPIK_API_KEY;

  if (!apiKey || apiKey === 'your_opik_api_key_here') {
    console.warn('OPIK_API_KEY not configured - running evaluation without Opik tracking');
    // Run evaluation locally without Opik
    return runLocalEvaluation(analyzeFunction);
  }

  const opik = new Opik({
    apiKey,
    projectName: options?.projectName || process.env.OPIK_PROJECT_NAME || 'greenwins',
  });

  // Create or get dataset
  const dataset = await opik.getOrCreateDataset('sustainability-metrics-eval');

  // Build and insert items
  const items = buildDatasetItems();
  await dataset.insert(items);

  // Define the evaluation task
  const task: EvaluationTask = async (datasetItem) => {
    const item = datasetItem as unknown as SustainabilityDatasetItem;
    const result = await analyzeFunction(item.input);

    // Return output in format expected by scoring metrics
    return {
      output: {
        co2Kg: result.co2Kg,
        waterLiters: result.waterLiters,
        energyKwh: result.energyKwh,
        treesEquivalent: result.treesEquivalent,
      },
      expected: item.expected_output,
      tolerance: item.metadata.tolerance,
      category: item.input.actionCategory,
    };
  };

  // Run evaluation with custom metrics
  const result = await evaluate({
    dataset,
    task,
    scoringMetrics: [
      new CO2AccuracyMetric(),
      new WaterAccuracyMetric(),
      new EnergyAccuracyMetric(),
      new BoundsComplianceMetric(),
      new OverallAccuracyMetric(),
    ],
    experimentName: options?.experimentName || `sustainability-eval-${new Date().toISOString().split('T')[0]}`,
  });

  await opik.flush();

  return result;
}

/**
 * Run evaluation locally without Opik (fallback)
 */
async function runLocalEvaluation(
  analyzeFunction: (input: SustainabilityDatasetItem['input']) => Promise<{
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
    treesEquivalent: number;
  }>
) {
  const items = buildDatasetItems();
  const results: Array<{
    id: string;
    passed: boolean;
    scores: { co2: number; water: number; energy: number; bounds: number; overall: number };
    output: { co2Kg: number; waterLiters: number; energyKwh: number; treesEquivalent: number };
    expected: { co2Kg: number; waterLiters: number; energyKwh: number; treesEquivalent: number };
  }> = [];

  for (const item of items) {
    try {
      const output = await analyzeFunction(item.input);

      const scoreInput: SustainabilityScoreInput = {
        output,
        expected: item.expected_output,
        tolerance: item.metadata.tolerance,
        category: item.input.actionCategory,
      };

      const co2Score = new CO2AccuracyMetric().score(scoreInput);
      const waterScore = new WaterAccuracyMetric().score(scoreInput);
      const energyScore = new EnergyAccuracyMetric().score(scoreInput);
      const boundsScore = new BoundsComplianceMetric().score(scoreInput);
      const overallScore = new OverallAccuracyMetric().score(scoreInput);

      results.push({
        id: item.metadata.id,
        passed: overallScore.value >= 0.7 && boundsScore.value >= 0.67,
        scores: {
          co2: co2Score.value,
          water: waterScore.value,
          energy: energyScore.value,
          bounds: boundsScore.value,
          overall: overallScore.value,
        },
        output,
        expected: item.expected_output,
      });
    } catch (error) {
      results.push({
        id: item.metadata.id,
        passed: false,
        scores: { co2: 0, water: 0, energy: 0, bounds: 0, overall: 0 },
        output: { co2Kg: 0, waterLiters: 0, energyKwh: 0, treesEquivalent: 0 },
        expected: item.expected_output,
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;

  return {
    summary: {
      total: results.length,
      passed: passedCount,
      passRate: passedCount / results.length,
      avgOverallAccuracy: results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length,
    },
    results,
  };
}
