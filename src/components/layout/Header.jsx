import { useWinCards } from '../../hooks/useWinCards'
import './Header.css'

function Header() {
  const { getWeeklyStats } = useWinCards()
  const stats = getWeeklyStats()

  return (
    <header className="header">
      <div className="header-title">
        <span className="header-icon">🌱</span>
        <h1>GreenWins</h1>
      </div>
      <div className="header-stats">
        <div className="stat">
          <span className="stat-value">{stats.totalStamps}</span>
          <span className="stat-label">wins</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.co2Saved.toFixed(1)}</span>
          <span className="stat-label">kg CO₂</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.streak}</span>
          <span className="stat-label">streak</span>
        </div>
      </div>
    </header>
  )
}

export default Header
