import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './components/AuthPage'
import { Dashboard } from './components/Dashboard'
import { BoardView } from './components/BoardView'
import './App.css'

// Main App Content Component
const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState<'dashboard' | 'board'>('dashboard')
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null)

  const handleOpenBoard = (boardId: string, boardData?: any) => {
    setCurrentBoardId(boardId)
    setCurrentView('board')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setCurrentBoardId(null)
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black/20 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (currentView === 'board' && currentBoardId) {
    return (
      <BoardView 
        boardId={currentBoardId} 
        onBack={handleBackToDashboard}
      />
    )
  }

  return (
    <Dashboard onOpenBoard={handleOpenBoard} />
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
