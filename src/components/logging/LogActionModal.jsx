import { useState } from 'react'
import { useWinCards } from '../../hooks/useWinCards'
import { useGemini } from '../../hooks/useGemini'
import AnalyzeButton from './AnalyzeButton'
import MetricsDisplay from './MetricsDisplay'
import './LogActionModal.css'

function LogActionModal({ card, day, onClose }) {
  const { logWin } = useWinCards()
  const { analyzeAction, loading, error } = useGemini()

  const [summary, setSummary] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const handleAnalyze = async () => {
    if (!summary.trim()) return

    const result = await analyzeAction(card, summary)
    if (result) {
      setAnalysis(result)
      setHasAnalyzed(true)
    }
  }

  const handleSave = () => {
    const win = {
      cardId: card.id,
      date: day.date,
      summary: summary.trim(),
      metrics: analysis?.metrics || {
        co2Saved: 0,
        energySaved: 0,
        waterSaved: 0,
        moneySaved: 0
      },
      aiAnalysis: analysis?.reasoning || null
    }

    logWin(win)
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formattedDate = new Date(day.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">{card.icon}</span>
            <div>
              <h2 className="modal-title">{card.name}</h2>
              <span className="modal-date">{formattedDate}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <label className="input-label">What did you do?</label>
          <textarea
            className="summary-input"
            placeholder={`Describe your ${card.name.toLowerCase()} action...`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />

          <AnalyzeButton
            onClick={handleAnalyze}
            loading={loading}
            disabled={!summary.trim()}
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {analysis && (
            <MetricsDisplay
              metrics={analysis.metrics}
              reasoning={analysis.reasoning}
            />
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!summary.trim()}
          >
            {hasAnalyzed ? 'Save Win' : 'Save Without Analysis'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogActionModal
