import { useEffect, useRef } from 'react'
import './MessageList.css'

function MessageList({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list empty">
        <div className="welcome-message">
          <span className="welcome-icon">🌱</span>
          <h3>Welcome to GreenBot!</h3>
          <p>I&apos;m here to help you make sustainable choices. Ask me anything about:</p>
          <ul>
            <li>Tips for your Win Cards</li>
            <li>New eco-friendly habits to try</li>
            <li>Impact of your actions</li>
            <li>Personalized suggestions</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.role}`}
        >
          {message.role === 'assistant' && (
            <span className="message-avatar">🌱</span>
          )}
          <div className="message-content">
            <p>{message.content}</p>
            <span className="message-time">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      ))}

      {loading && (
        <div className="message assistant">
          <span className="message-avatar">🌱</span>
          <div className="message-content typing">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
