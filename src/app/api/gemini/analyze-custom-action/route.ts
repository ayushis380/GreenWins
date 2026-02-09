import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisModel } from '@/lib/gemini/client';
import { CUSTOM_ACTION_ANALYSIS_PROMPT, CustomActionAnalysisContext } from '@/lib/gemini/prompts';
import { traceGeminiCall } from '@/lib/opik';
import { validateMetrics } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

interface AnalyzeCustomActionRequest {
  name?: string;
  description: string;
  category?: string;
}

interface CustomActionAnalysisResponse {
  actionName: string;
  category: string;
  icon: string;
  analysis: {
    aiInsight: string;
    sustainabilityScore: number;
    comparisonSummary: string;
    environmentalBenefit: string;
    improvementTips: string[];
  };
  impactMetrics: {
    co2Kg: number;
    waterLiters: number;
    energyKwh: number;
    treesEquivalent: number;
  };
  confidence: number;
  methodology: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = uuidv4();

  try {
    const body: AnalyzeCustomActionRequest = await request.json();

    const { name, description, category } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const context: CustomActionAnalysisContext = {
      actionName: name?.trim() || undefined,
      description: description.trim(),
      category: category || undefined,
    };

    const model = getAnalysisModel();
    const prompt = CUSTOM_ACTION_ANALYSIS_PROMPT(context);

    const { result, traceId: opikTraceId, latencyMs } = await traceGeminiCall(
      'Custom Action Analysis',
      {
        endpoint: 'analyze-custom-action',
        model: 'gemini-2.5-flash-lite',
        input: { name, description, category },
      },
      async () => {
        return await model.generateContent(prompt);
      }
    );

    const response = result.response;
    const responseText = response.text().trim();
    const finalTraceId = opikTraceId || traceId;

    const usageMetadata = response.usageMetadata;
    const tokenUsage = usageMetadata
      ? {
          inputTokens: usageMetadata.promptTokenCount || 0,
          outputTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
        }
      : undefined;

    let parsedResponse: CustomActionAnalysisResponse;
    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      return NextResponse.json({
        actionName: name?.trim() || 'Custom Action',
        category: category || 'other',
        icon: '🌱',
        analysis: {
          aiInsight: `Great sustainability action! "${description}" is a wonderful step toward a greener lifestyle.`,
          sustainabilityScore: 6,
          comparisonSummary: 'Every sustainable action helps reduce your environmental footprint.',
          environmentalBenefit: 'Contributes to reducing greenhouse gas emissions and conserving natural resources.',
          improvementTips: ['Keep tracking your sustainable actions to build lasting habits!'],
        },
        impactMetrics: {
          co2Kg: 1,
          waterLiters: 0,
          energyKwh: 0,
          treesEquivalent: 0.05,
        },
        confidence: 0.5,
        methodology: 'Used default estimates due to analysis parsing error.',
        trace: {
          id: finalTraceId,
          endpoint: 'analyze-custom-action',
          model: 'gemini-2.5-flash-lite',
          latencyMs,
          status: 'fallback',
          tokenUsage,
        },
      });
    }

    // Validate impact metrics using scientific bounds
    const resolvedCategory = parsedResponse.category || category || 'other';
    const metrics = {
      co2Kg: parsedResponse.impactMetrics.co2Kg,
      waterLiters: parsedResponse.impactMetrics.waterLiters,
      energyKwh: parsedResponse.impactMetrics.energyKwh,
      treesEquivalent: parsedResponse.impactMetrics.treesEquivalent,
      category: resolvedCategory,
    };

    // Use conservative base metrics for validation (since there are no base metrics for custom actions)
    const baseMetrics = {
      co2Kg: 1,
      waterLiters: 10,
      energyKwh: 0.5,
      treesEquivalent: 0.05,
      category: resolvedCategory,
    };

    const validation = validateMetrics(metrics, baseMetrics);

    const adjustedConfidence = Math.min(
      parsedResponse.confidence || 0.7,
      validation.confidence
    );

    const finalMetrics = validation.isValid
      ? parsedResponse.impactMetrics
      : {
          co2Kg: validation.adjustedMetrics?.co2Kg ?? parsedResponse.impactMetrics.co2Kg,
          waterLiters: validation.adjustedMetrics?.waterLiters ?? parsedResponse.impactMetrics.waterLiters,
          energyKwh: validation.adjustedMetrics?.energyKwh ?? parsedResponse.impactMetrics.energyKwh,
          treesEquivalent: parsedResponse.impactMetrics.treesEquivalent,
        };

    return NextResponse.json({
      actionName: parsedResponse.actionName || name?.trim() || 'Custom Action',
      category: parsedResponse.category || category || 'other',
      icon: parsedResponse.icon || '🌱',
      analysis: {
        aiInsight: parsedResponse.analysis.aiInsight,
        sustainabilityScore: Math.min(10, Math.max(1, parsedResponse.analysis.sustainabilityScore)),
        comparisonSummary: parsedResponse.analysis.comparisonSummary,
        environmentalBenefit: parsedResponse.analysis.environmentalBenefit,
        improvementTips: parsedResponse.analysis.improvementTips || [],
      },
      impactMetrics: finalMetrics,
      confidence: adjustedConfidence,
      methodology: parsedResponse.methodology || 'AI-estimated based on action description.',
      trace: {
        id: finalTraceId,
        endpoint: 'analyze-custom-action',
        model: 'gemini-2.5-flash-lite',
        latencyMs,
        status: 'success',
        tokenUsage,
      },
    });
  } catch (error) {
    console.error('Custom action analysis error:', error);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        error: 'Failed to analyze custom action',
        trace: {
          id: traceId,
          endpoint: 'analyze-custom-action',
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
