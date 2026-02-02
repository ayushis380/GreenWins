import { NextRequest, NextResponse } from 'next/server';
import { getCalculatorModel } from '@/lib/gemini/client';
import { FUN_FACTS, ENCOURAGEMENTS, calculateEquivalencies } from '@/lib/constants';
import { traceGeminiCall } from '@/lib/opik';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = uuidv4();

  try {
    const { actionName, impactMetrics } = await request.json();

    if (!actionName || !impactMetrics) {
      return NextResponse.json(
        { error: 'Action name and impact metrics are required' },
        { status: 400 }
      );
    }

    const { co2Kg, waterLiters, energyKwh } = impactMetrics;
    const equivalencies = calculateEquivalencies(co2Kg, waterLiters, energyKwh);

    // Try to get an enhanced response from Gemini
    let enhancedMessage = '';
    let traceStatus: 'success' | 'fallback' = 'success';
    let tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number } | undefined;

    try {
      const model = getCalculatorModel();
      const prompt = `
        The user just logged a "${actionName}" sustainability action. This saved:
        - ${co2Kg} kg of CO2
        - ${waterLiters} liters of water
        - ${energyKwh} kWh of energy

        Provide a single sentence (20-30 words max) celebration message that:
        1. Acknowledges their specific action
        2. Includes one relatable comparison (like "that's like..." or "equivalent to...")
        3. Is encouraging and positive

        Just the message, no formatting or prefixes.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      enhancedMessage = response.text().trim();

      // Extract token usage if available
      const usageMetadata = response.usageMetadata;
      tokenUsage = usageMetadata
        ? {
            inputTokens: usageMetadata.promptTokenCount || 0,
            outputTokens: usageMetadata.candidatesTokenCount || 0,
            totalTokens: usageMetadata.totalTokenCount || 0,
          }
        : undefined;
    } catch {
      // Fallback to static content if Gemini fails
      enhancedMessage = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      traceStatus = 'fallback';
    }

    // Select a random fun fact
    const funFact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      impact: impactMetrics,
      equivalencies,
      message: enhancedMessage,
      funFact,
      timestamp: new Date().toISOString(),
      trace: {
        id: traceId,
        endpoint: 'calculate-impact',
        model: 'gemini-2.5-flash-lite',
        latencyMs,
        status: traceStatus,
        tokenUsage,
        confidence: 0.9,
      },
    });
  } catch (error) {
    console.error('Impact calculation error:', error);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        error: 'Failed to calculate impact',
        trace: {
          id: traceId,
          endpoint: 'calculate-impact',
          model: 'gemini-2.5-flash-lite',
          latencyMs,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
