import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { defaultCards } from '../data/defaultCards'

const WinCardsContext = createContext(null)

// Helper to read from localStorage
function readFromStorage(key, defaultValue) {
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

// Helper to write to localStorage
function writeToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error)
  }
}

export function WinCardsProvider({ children }) {
  const [cards, setCards] = useState(() => readFromStorage('greenwins-cards', defaultCards))
  const [dailyWins, setDailyWins] = useState(() => readFromStorage('greenwins-wins', []))

  // Sync to localStorage whenever state changes
  useEffect(() => {
    writeToStorage('greenwins-cards', cards)
  }, [cards])

  useEffect(() => {
    writeToStorage('greenwins-wins', dailyWins)
  }, [dailyWins])

  const addCard = useCallback((card) => {
    const newCard = {
      ...card,
      id: card.id || `card-${Date.now()}`
    }
    setCards(prev => [...prev, newCard])
    return newCard
  }, [])

  const removeCard = useCallback((cardId) => {
    setCards(prev => prev.filter(card => card.id !== cardId))
    setDailyWins(prev => prev.filter(win => win.cardId !== cardId))
  }, [])

  const logWin = useCallback((win) => {
    const newWin = {
      ...win,
      id: `win-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
    setDailyWins(prev => [...prev, newWin])
    return newWin
  }, [])

  const removeWin = useCallback((winId) => {
    setDailyWins(prev => prev.filter(win => win.id !== winId))
  }, [])

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

  const value = useMemo(() => ({
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
  }), [
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
  ])

  return (
    <WinCardsContext.Provider value={value}>
      {children}
    </WinCardsContext.Provider>
  )
}

export function useWinCards() {
  const context = useContext(WinCardsContext)
  if (!context) {
    throw new Error('useWinCards must be used within a WinCardsProvider')
  }
  return context
}

export default WinCardsContext
