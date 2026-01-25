import './MetricsDisplay.css'

function MetricsDisplay({ metrics, reasoning }) {
  if (!metrics) return null

  const metricItems = [
    { key: 'co2Saved', label: 'CO₂ Saved', unit: 'kg', icon: '🌍' },
    { key: 'energySaved', label: 'Energy Saved', unit: 'kWh', icon: '⚡' },
    { key: 'waterSaved', label: 'Water Saved', unit: 'L', icon: '💧' },
    { key: 'moneySaved', label: 'Money Saved', unit: '$', icon: '💰' }
  ]

  const hasAnyMetric = metricItems.some(item => metrics[item.key] > 0)

  if (!hasAnyMetric) {
    return (
      <div className="metrics-display empty">
        <p>No measurable impact calculated for this action.</p>
      </div>
    )
  }

  return (
    <div className="metrics-display">
      <h4 className="metrics-title">Impact Analysis</h4>

      <div className="metrics-grid">
        {metricItems.map(item => (
          metrics[item.key] > 0 && (
            <div key={item.key} className="metric-item">
              <span className="metric-icon">{item.icon}</span>
              <span className="metric-value">
                {item.key === 'moneySaved' ? '$' : ''}
                {metrics[item.key].toFixed(2)}
                {item.key !== 'moneySaved' ? ` ${item.unit}` : ''}
              </span>
              <span className="metric-label">{item.label}</span>
            </div>
          )
        ))}
      </div>

      {reasoning && (
        <div className="metrics-reasoning">
          <h5>How we calculated this:</h5>
          <p>{reasoning}</p>
        </div>
      )}
    </div>
  )
}

export default MetricsDisplay
