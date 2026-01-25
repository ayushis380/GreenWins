import { useState } from 'react'
import './ChatInput.css'

function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input"
        placeholder="Ask for sustainability tips..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        type="submit"
        className="send-button"
        disabled={!message.trim() || disabled}
      >
        <span className="send-icon">↑</span>
      </button>
    </form>
  )
}

export default ChatInput
