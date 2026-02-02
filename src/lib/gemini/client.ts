import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getChatModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      maxOutputTokens: 1024,
    },
  });
}

export function getCalculatorModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
    },
  });
}

export function getAnalysisModel() {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  });
}
