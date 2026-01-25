import { useWinCards } from '../../hooks/useWinCards'
import './Header.css'

function Header({ activeView, onViewChange }) {
  const { getWeeklyStats } = useWinCards()
  const stats = getWeeklyStats()

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="header-icon">🌱</span>
          <h1>GreenWins</h1>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-button ${activeView === 'cards' ? 'active' : ''}`}
            onClick={() => onViewChange('cards')}
          >
            🏆 Win Cards
          </button>
          <button
            className={`nav-button ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => onViewChange('chat')}
          >
            💬 Chat Assistant
          </button>
        </nav>
      </div>

      <div className="header-stats">
        <div className="stat">
          <span className="stat-icon">🏅</span>
          <div className="stat-content">
            <span className="stat-value">{stats.totalStamps}</span>
            <span className="stat-label">Wins</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">🔥</span>
          <div className="stat-content">
            <span className="stat-value">{stats.streak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <span className="stat-icon">🌍</span>
          <div className="stat-content">
            <span className="stat-value">{stats.co2Saved.toFixed(1)} kg</span>
            <span className="stat-label">CO₂ Saved</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">💧</span>
          <div className="stat-content">
            <span className="stat-value">{stats.waterSaved.toFixed(0)} L</span>
            <span className="stat-label">Water Saved</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">⚡</span>
          <div className="stat-content">
            <span className="stat-value">{stats.energySaved.toFixed(1)} kWh</span>
            <span className="stat-label">Energy Saved</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">💰</span>
          <div className="stat-content">
            <span className="stat-value">${stats.moneySaved.toFixed(2)}</span>
            <span className="stat-label">Money Saved</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
