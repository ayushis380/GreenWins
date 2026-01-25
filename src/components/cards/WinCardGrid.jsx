import { useState } from 'react'
import { useWinCards } from '../../hooks/useWinCards'
import WinCard from './WinCard'
import CreateCardModal from './CreateCardModal'
import './WinCardGrid.css'

function WinCardGrid() {
  const { cards } = useWinCards()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="win-card-grid">
      {cards.map(card => (
        <WinCard key={card.id} card={card} />
      ))}

      <button
        className="add-card-button"
        onClick={() => setShowCreateModal(true)}
      >
        <span className="add-icon">+</span>
        <span>Add New Card</span>
      </button>

      {showCreateModal && (
        <CreateCardModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

export default WinCardGrid
