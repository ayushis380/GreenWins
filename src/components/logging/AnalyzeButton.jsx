import './AnalyzeButton.css'

function AnalyzeButton({ onClick, loading, disabled }) {
  return (
    <button
      className={`analyze-button ${loading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <span className="sparkle">✨</span>
          <span>Analyze Impact</span>
        </>
      )}
    </button>
  )
}

export default AnalyzeButton
