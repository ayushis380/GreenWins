#!/usr/bin/env npx ts-node
/**
 * CLI script to run sustainability metrics evaluation
 *
 * Usage:
 *   npx ts-node scripts/run-evaluation.ts [options]
 *
 * Options:
 *   --verbose       Show detailed output for each test case
 *   --threshold     Minimum pass rate to consider success (default: 0.7)
 *
 * Examples:
 *   npx ts-node scripts/run-evaluation.ts --verbose
 *   npx ts-node scripts/run-evaluation.ts --threshold 0.8
 */

import {
  runOpikEvaluation,
  EVALUATION_DATASET,
  SustainabilityDatasetItem,
} from '../src/lib/opik/evaluation';

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const threshold = parseFloat(args[args.indexOf('--threshold') + 1] || '0.7');

// Analyze function that calls the local API
async function analyzeWithAPI(input: SustainabilityDatasetItem['input']) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/gemini/analyze-stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.calculatedImpact;
}

async function main() {
  console.log('Starting Sustainability Metrics Evaluation...\n');
  console.log(`Running all ${EVALUATION_DATASET.length} test cases`);

  try {
    const result = await runOpikEvaluation(analyzeWithAPI);

    if (verbose) {
      console.log('\nDetailed Results:');
      console.log(JSON.stringify(result, null, 2));
    }

    // Extract pass rate from result
    const testResults = (result as { testResults?: Array<{ scoreResults: Array<{ name: string; value: number }> }> }).testResults;

    if (testResults) {
      let passedCount = 0;
      for (const tr of testResults) {
        const overall = tr.scoreResults.find((s: { name: string }) => s.name === 'overall_accuracy');
        const bounds = tr.scoreResults.find((s: { name: string }) => s.name === 'bounds_compliance');
        if (overall && bounds && overall.value >= 0.7 && bounds.value >= 0.67) {
          passedCount++;
        }
      }

      const passRate = passedCount / testResults.length;

      console.log('\n' + '='.repeat(60));
      console.log('RESULTS');
      console.log('='.repeat(60));
      console.log(`Total: ${testResults.length}`);
      console.log(`Passed: ${passedCount} (${(passRate * 100).toFixed(1)}%)`);
      console.log(`Failed: ${testResults.length - passedCount}`);

      if (passRate < threshold) {
        console.log(`\nPass rate ${(passRate * 100).toFixed(1)}% is below threshold ${(threshold * 100).toFixed(1)}%`);
        process.exit(1);
      } else {
        console.log(`\nPass rate ${(passRate * 100).toFixed(1)}% meets threshold ${(threshold * 100).toFixed(1)}%`);
        process.exit(0);
      }
    } else {
      // Local evaluation fallback result
      const localResult = result as { summary: { total: number; passed: number; passRate: number } };
      console.log('\n' + '='.repeat(60));
      console.log('RESULTS');
      console.log('='.repeat(60));
      console.log(`Total: ${localResult.summary.total}`);
      console.log(`Passed: ${localResult.summary.passed} (${(localResult.summary.passRate * 100).toFixed(1)}%)`);
      console.log(`Failed: ${localResult.summary.total - localResult.summary.passed}`);

      if (localResult.summary.passRate < threshold) {
        console.log(`\nPass rate ${(localResult.summary.passRate * 100).toFixed(1)}% is below threshold ${(threshold * 100).toFixed(1)}%`);
        process.exit(1);
      } else {
        console.log(`\nPass rate ${(localResult.summary.passRate * 100).toFixed(1)}% meets threshold ${(threshold * 100).toFixed(1)}%`);
        process.exit(0);
      }
    }
  } catch (error) {
    console.error('\nEvaluation failed:', error);
    process.exit(1);
  }
}

main();
