import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { defaultCards } from '../data/defaultCards'

export function useWinCards() {
  const [cards, setCards] = useLocalStorage('greenwins-cards', defaultCards)
  const [dailyWins, setDailyWins] = useLocalStorage('greenwins-wins', [])

  const addCard = useCallback((card) => {
    const newCard = {
      ...card,
      id: card.id || `card-${Date.now()}`
    }
    setCards(prev => [...prev, newCard])
    return newCard
  }, [setCards])

  const removeCard = useCallback((cardId) => {
    setCards(prev => prev.filter(card => card.id !== cardId))
    setDailyWins(prev => prev.filter(win => win.cardId !== cardId))
  }, [setCards, setDailyWins])

  const logWin = useCallback((win) => {
    const newWin = {
      ...win,
      id: `win-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
    setDailyWins(prev => [...prev, newWin])
    return newWin
  }, [setDailyWins])

  const removeWin = useCallback((winId) => {
    setDailyWins(prev => prev.filter(win => win.id !== winId))
  }, [setDailyWins])

  const getWinsForCard = useCallback((cardId) => {
    return dailyWins.filter(win => win.cardId === cardId)
  }, [dailyWins])

  const getWinsForWeek = useCallback((cardId) => {
    const now = new Date()
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? 6 : day - 1
    startOfWeek.setDate(startOfWeek.getDate() - diff)
    startOfWeek.setHours(0, 0, 0, 0)

    return dailyWins.filter(win => {
      if (win.cardId !== cardId) return false
      const winDate = new Date(win.date)
      return winDate >= startOfWeek
    })
  }, [dailyWins])

  const hasWinForDay = useCallback((cardId, date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    return dailyWins.some(win => win.cardId === cardId && win.date === dateStr)
  }, [dailyWins])

  const getWinForDay = useCallback((cardId, date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    return dailyWins.find(win => win.cardId === cardId && win.date === dateStr)
  }, [dailyWins])

  const getWeeklyStats = useCallback(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? 6 : day - 1
    startOfWeek.setDate(startOfWeek.getDate() - diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const weeklyWins = dailyWins.filter(win => {
      const winDate = new Date(win.date)
      return winDate >= startOfWeek
    })

    const totalStamps = weeklyWins.length
    const co2Saved = weeklyWins.reduce((sum, win) => sum + (win.metrics?.co2Saved || 0), 0)
    const energySaved = weeklyWins.reduce((sum, win) => sum + (win.metrics?.energySaved || 0), 0)
    const waterSaved = weeklyWins.reduce((sum, win) => sum + (win.metrics?.waterSaved || 0), 0)
    const moneySaved = weeklyWins.reduce((sum, win) => sum + (win.metrics?.moneySaved || 0), 0)

    // Calculate streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const hasWinOnDay = dailyWins.some(win => win.date === dateStr)
      if (hasWinOnDay) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return {
      totalStamps,
      co2Saved,
      energySaved,
      waterSaved,
      moneySaved,
      streak
    }
  }, [dailyWins])

  const getWeekDays = useMemo(() => {
    const days = []
    const now = new Date()
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? 6 : day - 1
    startOfWeek.setDate(startOfWeek.getDate() - diff)
    startOfWeek.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        isToday: date.toDateString() === now.toDateString(),
        isPast: date < now && date.toDateString() !== now.toDateString()
      })
    }
    return days
  }, [])

  return {
    cards,
    dailyWins,
    addCard,
    removeCard,
    logWin,
    removeWin,
    getWinsForCard,
    getWinsForWeek,
    hasWinForDay,
    getWinForDay,
    getWeeklyStats,
    getWeekDays
  }
}

export default useWinCards
