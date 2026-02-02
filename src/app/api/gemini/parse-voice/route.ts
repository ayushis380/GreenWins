import { NextRequest, NextResponse } from 'next/server';
import { getCalculatorModel } from '@/lib/gemini/client';
import { VOICE_PARSER_PROMPT } from '@/lib/gemini/prompts';

export async function POST(request: NextRequest) {
  try {
    const { transcript, availableActions } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const actionNames = availableActions?.map((a: { name: string }) => a.name) || [];

    const model = getCalculatorModel();
    const prompt = `
${VOICE_PARSER_PROMPT(actionNames)}

User said: "${transcript}"

Respond with only the JSON object, no markdown formatting.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Try to parse the JSON response
    let parsedResult;
    try {
      // Remove any markdown code block formatting if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch {
      // If parsing fails, return a default response
      parsedResult = {
        matchedAction: null,
        confidence: 0,
        interpretation: transcript,
        suggestNewAction: true,
        newActionSuggestion: null,
      };
    }

    return NextResponse.json({
      ...parsedResult,
      originalTranscript: transcript,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Voice parsing error:', error);

    return NextResponse.json(
      { error: 'Failed to parse voice input' },
      { status: 500 }
    );
  }
}
