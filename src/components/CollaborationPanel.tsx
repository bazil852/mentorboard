import React, { useState } from 'react'
import { Editor } from 'tldraw'

interface CollaborationPanelProps {
  roomId: string
  editor: Editor | null
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  roomId,
  editor
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const shareUrl = `${window.location.origin}?room=${encodeURIComponent(roomId)}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('Room URL copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  // Circular toggle button
  const toggleButton = (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-12 h-12 bg-white border-2 border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-105"
      title="Toggle Collaboration Panel"
    >
      <div className="flex items-center space-x-1">
        <span className="text-lg">🤝</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </button>
  )

  // Expanded panel
  const expandedPanel = (
    <div className="collaboration-panel rounded-lg shadow-lg p-4 w-80 bg-white border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-black">🤝 Collaboration Active</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 text-lg font-bold transition-colors"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room ID
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={roomId}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              onClick={copyToClipboard}
              className="btn-black-light px-3 py-2 rounded text-sm font-medium transition-all duration-200"
            >
              📋
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Share URL
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white text-black text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              onClick={copyToClipboard}
              className="btn-black px-3 py-2 rounded text-sm font-medium transition-all duration-200"
            >
              🔗
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-800 mb-2">💡 Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Share the URL to invite others</li>
            <li>• Changes sync in real-time</li>
            <li>• See live cursors and selections</li>
            <li>• Use cursor chat to communicate</li>
          </ul>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {isExpanded ? expandedPanel : toggleButton}
    </div>
  )
} 