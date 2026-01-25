import { useState } from 'react'
import Header from './components/layout/Header'
import WinCardGrid from './components/cards/WinCardGrid'
import ChatWindow from './components/chat/ChatWindow'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState('cards')

  return (
    <div className="app">
      <Header activeView={activeView} onViewChange={setActiveView} />
      <main className="main-content">
        {activeView === 'cards' ? <WinCardGrid /> : <ChatWindow />}
      </main>
    </div>
  )
}

export default App
