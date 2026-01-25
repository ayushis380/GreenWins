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

  const weeklyMetrics = weeklyWins.reduce((acc, win) => ({
    co2Saved: acc.co2Saved + (win.metrics?.co2Saved || 0),
    waterSaved: acc.waterSaved + (win.metrics?.waterSaved || 0),
    energySaved: acc.energySaved + (win.metrics?.energySaved || 0),
    moneySaved: acc.moneySaved + (win.metrics?.moneySaved || 0)
  }), { co2Saved: 0, waterSaved: 0, energySaved: 0, moneySaved: 0 })

  const handleStampClick = (day) => {
    if (!hasWinForDay(card.id, day.date)) {
      setSelectedDay(day)
    }
  }

  const handleModalClose = () => {
    setSelectedDay(null)
  }

  const categoryColor = categoryColors[card.category] || 'var(--color-primary)'

  const hasAnyImpact = weeklyMetrics.co2Saved > 0 || weeklyMetrics.waterSaved > 0 ||
                        weeklyMetrics.energySaved > 0 || weeklyMetrics.moneySaved > 0

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
        </div>

        {hasAnyImpact && (
          <div className="card-impact">
            {weeklyMetrics.co2Saved > 0 && (
              <span className="impact-item">🌍 {weeklyMetrics.co2Saved.toFixed(1)}kg CO₂</span>
            )}
            {weeklyMetrics.waterSaved > 0 && (
              <span className="impact-item">💧 {weeklyMetrics.waterSaved.toFixed(0)}L</span>
            )}
            {weeklyMetrics.energySaved > 0 && (
              <span className="impact-item">⚡ {weeklyMetrics.energySaved.toFixed(1)}kWh</span>
            )}
            {weeklyMetrics.moneySaved > 0 && (
              <span className="impact-item">💰 ${weeklyMetrics.moneySaved.toFixed(2)}</span>
            )}
          </div>
        )}
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
