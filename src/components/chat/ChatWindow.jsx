import { useCallback } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useGemini } from '../../hooks/useGemini'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import './ChatWindow.css'

function ChatWindow() {
  const [messages, setMessages] = useLocalStorage('greenwins-chat', [])
  const { sendChatMessage, loading, error, isConfigured } = useGemini()

  const handleSend = useCallback(async (content) => {
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])

    const allMessages = [...messages, userMessage]
    const response = await sendChatMessage(allMessages)

    if (response) {
      const assistantMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])
    }
  }, [messages, sendChatMessage, setMessages])

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-avatar">🌱</span>
          <div>
            <h2>GreenBot</h2>
            <span className="chat-status">
              {isConfigured ? 'AI-powered' : 'Demo mode'}
            </span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="clear-chat-btn" onClick={handleClearChat}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}

      <MessageList messages={messages} loading={loading} />
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}

export default ChatWindow
