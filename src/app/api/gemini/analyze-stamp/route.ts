import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisModel } from '@/lib/gemini/client';
import { STAMP_ANALYSIS_PROMPT, StampAnalysisContext } from '@/lib/gemini/prompts';
import { StampAnalysis, AICalculatedImpact } from '@/types';
import { traceGeminiCall } from '@/lib/opik';
import { validateAgainstDescription } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

interface AnalyzeStampRequest {
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
}

interface AnalysisResponse {
  analysis: {
    aiInsight: string;
    sustainabilityScore: number;
    comparisonSummary: string;
    environmentalBenefit: string;
    improvementTips: string[];
  };
  calculatedImpact: {
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
    treesEquivalent: number;
    confidence: number;
    methodology: string;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = uuidv4();

  try {
    const body: AnalyzeStampRequest = await request.json();

    const { actionName, actionCategory, actionDescription, userDescription, baseImpactMetrics } = body;

    if (!actionName || !userDescription || !baseImpactMetrics) {
      return NextResponse.json(
        { error: 'Action name, user description, and base impact metrics are required' },
        { status: 400 }
      );
    }

    const context: StampAnalysisContext = {
      actionName,
      actionCategory: actionCategory || 'other',
      actionDescription: actionDescription || '',
      userDescription,
      baseImpactMetrics,
    };

    const model = getAnalysisModel();
    const prompt = STAMP_ANALYSIS_PROMPT(context);

    // Trace the Gemini call with Opik
    const { result, traceId: opikTraceId, latencyMs } = await traceGeminiCall(
      'Stamp Analysis',
      {
        endpoint: 'analyze-stamp',
        model: 'gemini-2.5-flash-lite',
        input: { actionName, userDescription, baseImpactMetrics },
      },
      async () => {
        return await model.generateContent(prompt);
      }
    );

    const response = result.response;
    const responseText = response.text().trim();
    const finalTraceId = opikTraceId || traceId;

    // Extract token usage if available
    const usageMetadata = response.usageMetadata;
    const tokenUsage = usageMetadata
      ? {
          inputTokens: usageMetadata.promptTokenCount || 0,
          outputTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
        }
      : undefined;

    // Parse the JSON response
    let parsedResponse: AnalysisResponse;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      // Return a fallback response
      return NextResponse.json({
        analysis: {
          userDescription,
          aiInsight: `Great job completing "${actionName}"! Every sustainable action counts toward a healthier planet.`,
          sustainabilityScore: 7,
          comparisonSummary: `This action helps reduce your carbon footprint equivalent to planting ${baseImpactMetrics.treesEquivalent.toFixed(2)} trees.`,
          environmentalBenefit: 'Reduces greenhouse gas emissions and conserves natural resources.',
          improvementTips: ['Keep tracking your sustainable actions consistently!'],
          analyzedAt: new Date().toISOString(),
        } as StampAnalysis,
        calculatedImpact: {
          ...baseImpactMetrics,
          confidence: 0.7,
          methodology: 'Used base impact metrics due to analysis parsing error.',
        } as AICalculatedImpact,
        trace: {
          id: finalTraceId,
          endpoint: 'analyze-stamp',
          model: 'gemini-2.5-flash-lite',
          latencyMs,
          status: 'fallback',
          tokenUsage,
          confidence: 0.7,
        },
      });
    }

    // Format the response
    const analysis: StampAnalysis = {
      userDescription,
      aiInsight: parsedResponse.analysis.aiInsight,
      sustainabilityScore: Math.min(10, Math.max(1, parsedResponse.analysis.sustainabilityScore)),
      comparisonSummary: parsedResponse.analysis.comparisonSummary,
      environmentalBenefit: parsedResponse.analysis.environmentalBenefit,
      improvementTips: parsedResponse.analysis.improvementTips,
      analyzedAt: new Date().toISOString(),
    };

    const calculatedImpact: AICalculatedImpact = {
      co2Kg: parsedResponse.calculatedImpact.co2Kg,
      waterLiters: parsedResponse.calculatedImpact.waterLiters,
      energyKwh: parsedResponse.calculatedImpact.energyKwh,
      treesEquivalent: parsedResponse.calculatedImpact.treesEquivalent,
      confidence: parsedResponse.calculatedImpact.confidence,
      methodology: parsedResponse.calculatedImpact.methodology,
    };

    // Validate LLM-generated metrics against scientific bounds
    const validation = validateAgainstDescription(
      {
        ...calculatedImpact,
        category: actionCategory,
        userDescription,
      },
      {
        ...baseImpactMetrics,
        category: actionCategory,
      },
      userDescription
    );

    // Adjust confidence based on validation
    const adjustedConfidence = Math.min(
      calculatedImpact.confidence,
      validation.confidence
    );

    // If validation failed, use adjusted metrics
    const finalImpact: AICalculatedImpact = validation.isValid
      ? calculatedImpact
      : {
          ...calculatedImpact,
          ...(validation.adjustedMetrics || {}),
          confidence: adjustedConfidence,
          methodology: calculatedImpact.methodology + ' (Validated & adjusted)',
        };

    return NextResponse.json({
      analysis,
      calculatedImpact: finalImpact,
      validation: {
        isValid: validation.isValid,
        confidence: validation.confidence,
        warnings: validation.warnings,
        errors: validation.errors,
      },
      trace: {
        id: finalTraceId,
        endpoint: 'analyze-stamp',
        model: 'gemini-2.5-flash-lite',
        latencyMs,
        status: 'success',
        tokenUsage,
        confidence: adjustedConfidence,
        validation: {
          isValid: validation.isValid,
          warnings: validation.warnings.length,
          errors: validation.errors.length,
        },
      },
    });
  } catch (error) {
    console.error('Stamp analysis error:', error);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        error: 'Failed to analyze stamp',
        trace: {
          id: traceId,
          endpoint: 'analyze-stamp',
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
