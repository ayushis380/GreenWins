import { NextRequest, NextResponse } from 'next/server';
import { getChatModel } from '@/lib/gemini/client';
import { SUSTAINABILITY_ADVISOR_PROMPT, UserContext } from '@/lib/gemini/prompts';
import { traceGeminiCall } from '@/lib/opik';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const localTraceId = uuidv4();

  try {
    const { message, userContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const context: UserContext = userContext || {
      actions: [],
      weeklyCompletions: 0,
      currentStreak: 0,
      totalCO2: 0,
      totalWater: 0,
      totalEnergy: 0,
      level: 1,
    };

    const model = getChatModel();
    const systemPrompt = SUSTAINABILITY_ADVISOR_PROMPT(context);

    // Trace the Gemini call with Opik
    const { result, traceId: opikTraceId, latencyMs } = await traceGeminiCall(
      'GreenGuide Chat',
      {
        endpoint: 'chat',
        model: 'gemini-2.5-flash-lite',
        input: { message, userContext: context },
      },
      async () => {
        // Use startChat for conversation context
        const chat = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }],
            },
            {
              role: 'model',
              parts: [{ text: 'I understand. I am GreenGuide, your sustainability advisor. How can I help you today?' }],
            },
          ],
        });

        const result = await chat.sendMessage(message);
        return result;
      }
    );

    const response = result.response;
    const text = response.text();

    // Extract token usage if available
    const usageMetadata = response.usageMetadata;
    const tokenUsage = usageMetadata
      ? {
          inputTokens: usageMetadata.promptTokenCount || 0,
          outputTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
        }
      : undefined;

    return NextResponse.json({
      message: text,
      timestamp: new Date().toISOString(),
      trace: {
        id: opikTraceId || localTraceId,
        endpoint: 'chat',
        model: 'gemini-2.5-flash-lite',
        latencyMs,
        status: 'success',
        tokenUsage,
        confidence: 0.85,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const latencyMs = Date.now() - startTime;

    // Return a friendly fallback response if API fails
    return NextResponse.json({
      message: "I'm having trouble connecting right now, but I'm still here to help! 🌱 Try asking me about sustainable actions you can take today, or let me know what eco-friendly habits you're working on.",
      timestamp: new Date().toISOString(),
      isError: true,
      trace: {
        id: localTraceId,
        endpoint: 'chat',
        model: 'gemini-2.5-flash-lite',
        latencyMs,
        status: 'fallback',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
