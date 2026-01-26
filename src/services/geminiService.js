import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_NAME = 'gemini-2.5-flash-lite'

class GeminiAgent {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY
    this.client = null
    this.model = null
    this.chatSession = null
  }

  initialize() {
    if (!this.isConfigured()) {
      return false
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(this.apiKey)
      this.model = this.client.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    }
    return true
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'your_gemini_api_key_here')
  }

  async generateContent(prompt, systemPrompt = null) {
    if (!this.initialize()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.')
    }

    try {
      let fullPrompt = prompt
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\n---\n\nUser Request:\n${prompt}`
      }

      const result = await this.model.generateContent(fullPrompt)
      const response = result.response
      const text = response.text()

      if (!text) {
        throw new Error('No response generated')
      }

      return text
    } catch (error) {
      console.error('Gemini generateContent error:', error)
      throw new Error(error.message || 'Failed to generate content')
    }
  }

  async startChat(systemPrompt) {
    if (!this.initialize()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.')
    }

    this.chatSession = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Understood! I am GreenBot, your sustainability assistant. I\'m ready to help you with eco-friendly tips, track your environmental impact, and suggest ways to live more sustainably. How can I help you today?' }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    })

    return this.chatSession
  }

  async chat(messages, systemPrompt) {
    if (!this.initialize()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.')
    }

    try {
      // Build history from messages
      const history = []

      // Add system prompt as first exchange
      if (systemPrompt) {
        history.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        })
        history.push({
          role: 'model',
          parts: [{ text: 'Understood! I am GreenBot, your sustainability assistant ready to help!' }]
        })
      }

      // Add previous messages (except the last one which we'll send)
      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i]
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })
      }

      // Start chat with history
      const chat = this.model.startChat({ history })

      // Send the last message
      const lastMessage = messages[messages.length - 1]
      const result = await chat.sendMessage(lastMessage.content)
      const response = result.response
      const text = response.text()

      if (!text) {
        throw new Error('No response generated')
      }

      return text
    } catch (error) {
      console.error('Gemini chat error:', error)
      throw new Error(error.message || 'Failed to generate response')
    }
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

// Export singleton instance
export const geminiService = new GeminiAgent()
export default geminiService
