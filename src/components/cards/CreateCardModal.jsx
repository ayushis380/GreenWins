import { useState } from 'react'
import { useWinCards } from '../../hooks/useWinCards'
import { useGemini } from '../../hooks/useGemini'
import './CreateCardModal.css'

const CATEGORIES = ['transportation', 'food', 'water', 'energy', 'waste']
const SUGGESTED_ICONS = ['🌱', '♻️', '🚶', '🌿', '🌍', '💚', '🌳', '☀️', '🍃', '🚲']

function CreateCardModal({ onClose }) {
  const { addCard } = useWinCards()
  const { suggestCardIdea, loading } = useGemini()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🌱')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('waste')
  const [interest, setInterest] = useState('')

  const handleSuggest = async () => {
    if (!interest.trim()) return

    const suggestion = await suggestCardIdea(interest)
    if (suggestion) {
      setName(suggestion.name || '')
      setIcon(suggestion.icon || '🌱')
      setDescription(suggestion.description || '')
      setCategory(suggestion.category || 'waste')
    }
  }

  const handleSave = () => {
    if (!name.trim()) return

    addCard({
      name: name.trim(),
      icon,
      description: description.trim(),
      category
    })

    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content create-card-modal">
        <div className="modal-header">
          <h2 className="modal-title">Create New Card</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="ai-suggest-section">
            <label className="input-label">Get AI Suggestions</label>
            <div className="suggest-row">
              <input
                type="text"
                className="text-input"
                placeholder="e.g., composting, cycling, reducing plastic..."
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
              />
              <button
                className="suggest-button"
                onClick={handleSuggest}
                disabled={!interest.trim() || loading}
              >
                {loading ? '...' : '✨'}
              </button>
            </div>
          </div>

          <div className="divider">
            <span>or create manually</span>
          </div>

          <div className="form-group">
            <label className="input-label">Card Name</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g., Compost Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Icon</label>
            <div className="icon-picker">
              {SUGGESTED_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  className={`icon-option ${icon === emoji ? 'selected' : ''}`}
                  onClick={() => setIcon(emoji)}
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea
              className="text-input"
              placeholder="Brief description of the action..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Category</label>
            <div className="category-picker">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`category-option ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(cat)}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Create Card
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateCardModal
