import React from 'react'

interface MentorToolbarProps {
  isCollaborating: boolean
  onToggleCollaboration: () => void
  onCreateNewRoom: () => void
  onAddTemplate: (template: string) => void
  onShowSettings: () => void
  onPrintBoard: () => void
  roomId: string
}

export const MentorToolbar: React.FC<MentorToolbarProps> = ({
  isCollaborating,
  onToggleCollaboration,
  onCreateNewRoom,
  onAddTemplate,
  onShowSettings,
  onPrintBoard,
  roomId
}) => {
  return (
    <div className="p-3 space-y-3 min-w-[280px]">
      {/* Room Status */}
      {isCollaborating && (
        <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
          🌐 Room: {roomId.split('-').pop()}
        </div>
      )}

      {/* Templates Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Templates</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => onAddTemplate('1on1')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <span>📅</span>
            <span>1-on-1 Meeting</span>
          </button>
          <button
            onClick={() => onAddTemplate('feedback')}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            <span>💬</span>
            <span>Feedback Session</span>
          </button>
          <button
            onClick={() => onAddTemplate('planning')}
            className="flex items-center space-x-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
          >
            <span>📋</span>
            <span>Planning Board</span>
          </button>
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Actions</h3>
        <div className="space-y-2">
          <button
            onClick={onToggleCollaboration}
            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCollaborating
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{isCollaborating ? '👥' : '🔗'}</span>
            <span>{isCollaborating ? 'Collaborating' : 'Start Collaboration'}</span>
          </button>
          
          {!isCollaborating && (
            <button
              onClick={onCreateNewRoom}
              className="w-full flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <span>🚀</span>
              <span>New Room</span>
            </button>
          )}

          <button
            onClick={onShowSettings}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>

          <button
            onClick={onPrintBoard}
            className="w-full flex items-center justify-center space-x-2 bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            title="Print current board data to console"
          >
            <span>🖨️</span>
            <span>Debug Print</span>
          </button>
        </div>
      </div>
    </div>
  )
} 