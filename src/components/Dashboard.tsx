import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Board } from '../lib/supabase'
import { Plus, Calendar, Users, Settings, LogOut, Edit, Trash2, ExternalLink } from 'lucide-react'

interface DashboardProps {
  onOpenBoard: (boardId: string, boardData?: any) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenBoard }) => {
  const { user, signOut } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBoards()
    }
  }, [user])

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setBoards(data || [])
    } catch (error) {
      console.error('Error fetching boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBoard = async () => {
    if (!newBoardName.trim() || !user) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert({
          name: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
          user_id: user.id,
          board_data: {},
          is_public: false
        })
        .select()
        .single()

      if (error) throw error

      setBoards([data, ...boards])
      setShowCreateModal(false)
      setNewBoardName('')
      setNewBoardDescription('')
      
      // Immediately open the new board
      onOpenBoard(data.id, data.board_data)
    } catch (error) {
      console.error('Error creating board:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId)

      if (error) throw error
      setBoards(boards.filter(board => board.id !== boardId))
    } catch (error) {
      console.error('Error deleting board:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black/20 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/60">Loading your boards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black/5 overflow-auto">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-black/10">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">The Mentor Board</h1>
                <p className="text-sm text-black/60">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-4 py-2 text-black/60 hover:text-black transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-black/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-black/10 rounded-lg flex items-center justify-center">
                <Calendar className="text-black/70" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{boards.length}</p>
                <p className="text-black/60">Total Boards</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-black/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-black/10 rounded-lg flex items-center justify-center">
                <Users className="text-black/70" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">
                  {boards.filter(board => board.is_public).length}
                </p>
                <p className="text-black/60">Shared Boards</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-black/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-black/10 rounded-lg flex items-center justify-center">
                <Settings className="text-black/70" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">
                  {boards.filter(board => new Date(board.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
                <p className="text-black/60">Recent Activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Boards Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-black/10">
          <div className="p-6 border-b border-black/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">Your Boards</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-all duration-200"
              >
                <Plus size={16} />
                <span>New Board</span>
              </button>
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-black/40" size={32} />
              </div>
              <h3 className="text-lg font-medium text-black mb-2">No boards yet</h3>
              <p className="text-black/60 mb-6">Create your first board to start collaborating</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-black/80 transition-all duration-200"
              >
                Create Your First Board
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boards.map((board) => (
                  <div
                    key={board.id}
                    className="bg-white/60 backdrop-blur-sm rounded-lg p-4 hover:shadow-md transition-shadow border border-black/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-black truncate flex-1">{board.name}</h3>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => deleteBoard(board.id)}
                          className="p-1 text-black/40 hover:text-red-500 transition-colors"
                          title="Delete board"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {board.description && (
                      <p className="text-sm text-black/60 mb-3 line-clamp-2">{board.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-black/50 mb-3">
                      <span>Updated {formatDate(board.updated_at)}</span>
                      {board.is_public && (
                        <span className="bg-black/10 text-black/70 px-2 py-1 rounded">Public</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onOpenBoard(board.id, board.board_data)}
                      className="w-full flex items-center justify-center space-x-2 bg-black/10 border border-black/20 text-black/70 px-3 py-2 rounded hover:bg-black/20 transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>Open Board</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-black/10 max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Create New Board</h3>
              
                              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black/70 mb-1">
                      Board Name *
                    </label>
                    <input
                      type="text"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      placeholder="Enter board name..."
                      className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 bg-white/50"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black/70 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newBoardDescription}
                      onChange={(e) => setNewBoardDescription(e.target.value)}
                      placeholder="Describe your board..."
                      rows={3}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 resize-none bg-white/50"
                    />
                  </div>
                </div>
              
                              <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewBoardName('')
                      setNewBoardDescription('')
                    }}
                    className="px-4 py-2 text-black/60 hover:text-black transition-colors"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createBoard}
                    disabled={!newBoardName.trim() || creating}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-black/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Board'}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 