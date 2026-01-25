import { useState } from 'react'
import { useWinCards } from '../../hooks/useWinCards'
import DayStamp from './DayStamp'
import LogActionModal from '../logging/LogActionModal'
import { categoryColors } from '../../data/defaultCards'
import './WinCard.css'

function WinCard({ card }) {
  const { getWeekDays, hasWinForDay, getWinsForWeek } = useWinCards()
  const [selectedDay, setSelectedDay] = useState(null)

  const weeklyWins = getWinsForWeek(card.id)
  const weeklyCount = weeklyWins.length
  const weeklyCO2 = weeklyWins.reduce((sum, win) => sum + (win.metrics?.co2Saved || 0), 0)

  const handleStampClick = (day) => {
    if (!hasWinForDay(card.id, day.date)) {
      setSelectedDay(day)
    }
  }

  const handleModalClose = () => {
    setSelectedDay(null)
  }

  const categoryColor = categoryColors[card.category] || 'var(--color-primary)'

  return (
    <>
      <div className="win-card" style={{ '--category-color': categoryColor }}>
        <div className="card-header">
          <span className="card-icon">{card.icon}</span>
          <div className="card-title-group">
            <h3 className="card-title">{card.name}</h3>
            <span className="card-category">{card.category}</span>
          </div>
        </div>

        <div className="stamps-row">
          {getWeekDays.map((day) => (
            <DayStamp
              key={day.date}
              day={day}
              isStamped={hasWinForDay(card.id, day.date)}
              isToday={day.isToday}
              isPast={day.isPast}
              onClick={() => handleStampClick(day)}
              disabled={hasWinForDay(card.id, day.date)}
            />
          ))}
        </div>

        <div className="card-footer">
          <span className="weekly-count">{weeklyCount}/7 this week</span>
          {weeklyCO2 > 0 && (
            <span className="weekly-impact">{weeklyCO2.toFixed(1)}kg CO₂ saved</span>
          )}
        </div>
      </div>

      {selectedDay && (
        <LogActionModal
          card={card}
          day={selectedDay}
          onClose={handleModalClose}
        />
      )}
    </>
  )
}

export default WinCard
