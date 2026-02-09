import { NextRequest, NextResponse } from 'next/server';
import {
  runOpikEvaluation,
  buildDatasetItems,
  SustainabilityDatasetItem,
  TaskOutput,
} from '@/lib/opik/evaluation';

/**
 * POST /api/evaluate
 *
 * Runs the sustainability metrics evaluation using Opik's evaluate() function
 * with custom metrics (CO2Accuracy, WaterAccuracy, EnergyAccuracy, BoundsCompliance)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { experimentName } = body;

    // Define the analyze function that calls our Gemini API
    const analyzeFunction = async (
      input: SustainabilityDatasetItem['input']
    ): Promise<TaskOutput['output']> => {
      const response = await fetch(
        new URL('/api/gemini/analyze-stamp', request.url).toString(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionName: input.actionName,
            actionCategory: input.actionCategory,
            actionDescription: input.actionDescription,
            userDescription: input.userDescription,
            baseImpactMetrics: input.baseImpactMetrics,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.calculatedImpact;
    };

    // Run Opik evaluation
    const result = await runOpikEvaluation(analyzeFunction, {
      experimentName,
    });

    return NextResponse.json({
      success: true,
      evaluation: result,
      message: 'Evaluation complete. View results in your Opik dashboard.',
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      {
        error: 'Evaluation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evaluate
 *
 * Returns the evaluation dataset (test cases) without running evaluation.
 */
export async function GET() {
  const items = buildDatasetItems();

  return NextResponse.json({
    dataset: items.map((item) => ({
      id: item.metadata.id,
      actionName: item.input.actionName,
      actionCategory: item.input.actionCategory,
      userDescription: item.input.userDescription,
      expectedMetrics: item.expected_output,
      tolerance: item.metadata.tolerance,
    })),
    totalTestCases: items.length,
  });
}
