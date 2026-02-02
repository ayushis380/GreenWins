import { NextRequest, NextResponse } from 'next/server';
import { getChatModel } from '@/lib/gemini/client';
import { traceGeminiCall } from '@/lib/opik';
import { v4 as uuidv4 } from 'uuid';

interface WeeklyStats {
  totalStamps: number;
  uniqueActions: number;
  longestStreak: number;
  topAction: string;
  co2Saved: number;
  waterSaved: number;
  energySaved: number;
  actionBreakdown: { name: string; count: number }[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = uuidv4();

  try {
    const { stats, userName }: { stats: WeeklyStats; userName?: string } = await request.json();

    if (!stats) {
      return NextResponse.json({ error: 'Stats are required' }, { status: 400 });
    }

    const model = getChatModel();

    const prompt = `You are creating a personalized weekly sustainability narrative for ${userName || 'a user'}.
Write an engaging, story-like summary of their week in a warm, encouraging tone.

Their stats this week:
- Total sustainable actions: ${stats.totalStamps}
- Different types of actions: ${stats.uniqueActions}
- Current streak: ${stats.longestStreak} days
- Most frequent action: ${stats.topAction}
- CO2 saved: ${stats.co2Saved.toFixed(1)} kg
- Water saved: ${Math.round(stats.waterSaved)} liters
- Energy saved: ${stats.energySaved.toFixed(1)} kWh
- Actions breakdown: ${stats.actionBreakdown.map(a => `${a.name} (${a.count}x)`).join(', ')}

Generate a JSON response with this exact structure:
{
  "headline": "A catchy 5-8 word headline summarizing their week",
  "story": "A 2-3 sentence engaging narrative about their sustainability journey this week. Write it like a story recap, not a list of stats. Be creative and inspiring!",
  "highlights": ["3 specific achievements or moments to celebrate, each 8-15 words"],
  "encouragement": "A personalized encouragement message for next week (15-25 words)",
  "nextWeekGoal": "A suggested goal for next week based on their patterns (10-20 words)"
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or extra text.`;

    // Trace the Gemini call with Opik
    const { result, traceId: opikTraceId, latencyMs } = await traceGeminiCall(
      'Weekly Narrative',
      {
        endpoint: 'weekly-narrative',
        model: 'gemini-2.5-flash-lite',
        input: { stats, userName },
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
    let narrative;
    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      narrative = JSON.parse(cleanedResponse);
    } catch {
      // Fallback narrative
      narrative = {
        headline: 'Another Week of Green Wins!',
        story: `This week was a journey of sustainable choices. With ${stats.totalStamps} actions logged and ${stats.co2Saved.toFixed(1)} kg of CO2 saved, every small step added up to meaningful impact.`,
        highlights: [
          `Completed ${stats.totalStamps} sustainable actions`,
          `${stats.topAction} was your star habit this week`,
          `Maintained a ${stats.longestStreak}-day streak`,
        ],
        encouragement:
          'Keep building on this momentum! Every action counts toward a greener future.',
        nextWeekGoal: `Try to beat your ${stats.totalStamps} actions from this week!`,
      };
    }

    return NextResponse.json({
      narrative,
      stats,
      generatedAt: new Date().toISOString(),
      trace: {
        id: finalTraceId,
        endpoint: 'weekly-narrative',
        model: 'gemini-2.5-flash-lite',
        latencyMs,
        status: 'success',
        tokenUsage,
        confidence: 0.85,
      },
    });
  } catch (error) {
    console.error('Weekly narrative error:', error);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        error: 'Failed to generate narrative',
        trace: {
          id: traceId,
          endpoint: 'weekly-narrative',
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
