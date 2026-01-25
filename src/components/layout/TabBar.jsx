import './TabBar.css'

function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
        onClick={() => onTabChange('cards')}
      >
        <span className="tab-icon">🏆</span>
        <span className="tab-label">Win Cards</span>
      </button>
      <button
        className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
        onClick={() => onTabChange('chat')}
      >
        <span className="tab-icon">💬</span>
        <span className="tab-label">Chat</span>
      </button>
    </nav>
  )
}

export default TabBar
