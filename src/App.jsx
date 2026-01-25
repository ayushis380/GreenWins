import { useState } from 'react'
import Header from './components/layout/Header'
import TabBar from './components/layout/TabBar'
import WinCardGrid from './components/cards/WinCardGrid'
import ChatWindow from './components/chat/ChatWindow'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('cards')

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {activeTab === 'cards' ? <WinCardGrid /> : <ChatWindow />}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
