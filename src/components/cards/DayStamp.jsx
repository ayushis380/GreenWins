import './DayStamp.css'

function DayStamp({ day, isStamped, isToday, isPast, onClick, disabled }) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  return (
    <button
      className={`day-stamp ${isStamped ? 'stamped' : ''} ${isToday ? 'today' : ''} ${isPast && !isStamped ? 'missed' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={`${day.dayName} - ${isStamped ? 'Completed' : 'Not completed'}`}
    >
      <span className="day-label">{day.dayName}</span>
      <span className="stamp-circle">
        {isStamped && <span className="stamp-check">✓</span>}
      </span>
    </button>
  )
}

export default DayStamp
