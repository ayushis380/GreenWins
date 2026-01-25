import { useState, useCallback } from 'react'
import { geminiService } from '../services/geminiService'
import { getAnalyzeActionPrompt } from '../prompts/analyzeActionPrompt'
import { getChatSystemPrompt } from '../prompts/chatAssistantPrompt'
import { useWinCards } from './useWinCards'

export function useGemini() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { cards, dailyWins, getWeeklyStats } = useWinCards()

  const analyzeAction = useCallback(async (card, summary) => {
    setLoading(true)
    setError(null)

    try {
      if (!geminiService.isConfigured()) {
        // Return mock data if API not configured
        return getMockAnalysis(card)
      }

      const prompt = getAnalyzeActionPrompt(card, summary)
      const response = await geminiService.generateContent(prompt)
      const parsed = geminiService.parseJSONResponse(response)

      if (!parsed) {
        throw new Error('Could not parse AI response')
      }

      return parsed
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const sendChatMessage = useCallback(async (messages) => {
    setLoading(true)
    setError(null)

    try {
      const stats = getWeeklyStats()

      // Get recent wins with card names
      const recentWins = dailyWins
        .slice(-10)
        .map(win => {
          const card = cards.find(c => c.id === win.cardId)
          return {
            ...win,
            cardName: card?.name || 'Unknown'
          }
        })

      const userContext = {
        cards,
        recentWins,
        stats
      }

      if (!geminiService.isConfigured()) {
        // Return mock response if API not configured
        return getMockChatResponse(messages[messages.length - 1]?.content || '')
      }

      const systemPrompt = getChatSystemPrompt(userContext)
      const response = await geminiService.chat(messages, systemPrompt)

      return response
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [cards, dailyWins, getWeeklyStats])

  const suggestCardIdea = useCallback(async (interest) => {
    setLoading(true)
    setError(null)

    try {
      if (!geminiService.isConfigured()) {
        return getMockCardSuggestion(interest)
      }

      const prompt = `Based on the user's interest in "${interest}", suggest a sustainability action card.

Respond with ONLY valid JSON in this exact format:
{
  "name": "<short action name, 2-4 words>",
  "icon": "<single emoji>",
  "description": "<brief description of the action>",
  "category": "<one of: transportation, food, water, energy, waste>"
}`

      const response = await geminiService.generateContent(prompt)
      const parsed = geminiService.parseJSONResponse(response)

      return parsed
    } catch (err) {
      console.error('Card suggestion error:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    analyzeAction,
    sendChatMessage,
    suggestCardIdea,
    loading,
    error,
    isConfigured: geminiService.isConfigured()
  }
}

// Mock responses for when API is not configured
function getMockAnalysis(card) {
  const mockData = {
    transportation: { co2Saved: 2.5, energySaved: 1.2, waterSaved: 0, moneySaved: 3.5 },
    food: { co2Saved: 3.0, energySaved: 0.5, waterSaved: 50, moneySaved: 2.0 },
    water: { co2Saved: 0.2, energySaved: 0.8, waterSaved: 40, moneySaved: 0.5 },
    energy: { co2Saved: 0.5, energySaved: 2.0, waterSaved: 0, moneySaved: 0.3 },
    waste: { co2Saved: 0.1, energySaved: 0, waterSaved: 0, moneySaved: 0.1 }
  }

  return {
    metrics: mockData[card.category] || mockData.waste,
    reasoning: `[Demo Mode] Estimated impact based on typical ${card.category} action. Add your Gemini API key for real AI analysis.`
  }
}

function getMockChatResponse(message) {
  return `[Demo Mode] Thanks for your message! To get personalized sustainability suggestions powered by AI, please add your Gemini API key to the .env file.

In the meantime, here are some quick tips:
- Try to complete at least one green action each day
- Small consistent actions add up to big impact
- Check your Win Cards to track your progress!`
}

function getMockCardSuggestion(interest) {
  return {
    name: 'Eco Action',
    icon: '🌿',
    description: `A sustainable action related to ${interest}`,
    category: 'waste'
  }
}

export default useGemini
