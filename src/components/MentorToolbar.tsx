import React from 'react'

interface MentorToolbarProps {
  isCollaborating: boolean
  onToggleCollaboration: () => void
  onCreateNewRoom: () => void
  onAddTemplate: (template: string) => void
  onShowSettings: () => void
  roomId: string
}

export const MentorToolbar: React.FC<MentorToolbarProps> = ({
  isCollaborating,
  onToggleCollaboration,
  onCreateNewRoom,
  onAddTemplate,
  onShowSettings,
  roomId
}) => {
  return (
    <div className="mentor-toolbar fixed top-0 left-0 right-0 h-15 z-50 flex items-center justify-between px-4 py-2">
      {/* Left Section - Logo and Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="mentor-logo">
            <img 
              src="https://i.postimg.cc/25s922XT/image.png" 
              alt="The Mentor Board Logo"
              className="w-6 h-6 object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-black">The Mentor Board</h1>
        </div>
        
        {isCollaborating && (
          <div className="bg-gradient-to-r from-green-500 to-green-400 text-white px-3 py-1 rounded-full text-sm font-medium">
            🌐 Room: {roomId.split('-').pop()}
          </div>
        )}
      </div>

      {/* Center Section - Templates */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-700 mr-2 font-medium">Templates:</span>
        <button
          onClick={() => onAddTemplate('1on1')}
          className="template-btn-1on1 px-3 py-1 rounded text-sm font-medium transition-all duration-200"
        >
          📅 1-on-1
        </button>
        <button
          onClick={() => onAddTemplate('feedback')}
          className="template-btn-feedback px-3 py-1 rounded text-sm font-medium transition-all duration-200"
        >
          💬 Feedback
        </button>
        <button
          onClick={() => onAddTemplate('planning')}
          className="template-btn-planning px-3 py-1 rounded text-sm font-medium transition-all duration-200"
        >
          📋 Planning
        </button>
      </div>

      {/* Right Section - Collaboration and Settings */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleCollaboration}
          className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
            isCollaborating
              ? 'btn-black'
              : 'btn-black-outline'
          }`}
        >
          {isCollaborating ? '👥 Collaborating' : '🔗 Start Collaboration'}
        </button>
        
        {!isCollaborating && (
          <button
            onClick={onCreateNewRoom}
            className="btn-black-light px-4 py-2 rounded text-sm font-medium transition-all duration-200"
          >
            🚀 New Room
          </button>
        )}

        <button
          onClick={onShowSettings}
          className="btn-gray px-3 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-lg"
        >
          ⚙️
        </button>
      </div>
    </div>
  )
} 