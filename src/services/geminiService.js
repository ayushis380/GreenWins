const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'

class GeminiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'your_gemini_api_key_here')
  }

  async generateContent(prompt, systemPrompt = null) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.')
    }

    const contents = []

    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      })
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      })
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    })

    const response = await fetch(`${API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate content')
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response generated')
    }

    return text
  }

  async chat(messages, systemPrompt) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.')
    }

    const contents = []

    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      })
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I am GreenBot, ready to help with sustainability!' }]
      })
    }

    for (const msg of messages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    }

    const response = await fetch(`${API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate response')
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response generated')
    }

    return text
  }

  parseJSONResponse(text) {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('Failed to parse JSON:', e)
        return null
      }
    }
    return null
  }
}

export const geminiService = new GeminiService()
export default geminiService
