import React, { useState } from 'react'
import { Editor } from 'tldraw'

interface BoardSettingsProps {
  onClose: () => void
  editor: Editor | null
}

export const BoardSettings: React.FC<BoardSettingsProps> = ({
  onClose,
  editor
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'json'>('png')

  const handleExport = async () => {
    if (!editor) return

    try {
      const shapes = editor.getCurrentPageShapes()
      if (shapes.length === 0) {
        alert('No content to export!')
        return
      }

      switch (exportFormat) {
        case 'png':
          // Export as PNG using SVG conversion
          const svgForPng = await editor.getSvgString(shapes)
          if (svgForPng) {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()
            
            img.onload = () => {
              canvas.width = img.width * 2
              canvas.height = img.height * 2
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
              
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `mentor-board-${Date.now()}.png`
                  a.click()
                  URL.revokeObjectURL(url)
                }
              }, 'image/png')
            }
            
            img.src = 'data:image/svg+xml;base64,' + btoa(svgForPng.svg)
          }
          break
        case 'svg':
          const svgResult = await editor.getSvgString(shapes)
          if (svgResult) {
            const blob = new Blob([svgResult.svg], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `mentor-board-${Date.now()}.svg`
            a.click()
            URL.revokeObjectURL(url)
          }
          break
        case 'json':
          const data = editor.store.serialize()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `mentor-board-${Date.now()}.json`
          a.click()
          URL.revokeObjectURL(url)
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const clearBoard = () => {
    if (!editor) return
    
    const confirmed = window.confirm('Are you sure you want to clear the entire board? This action cannot be undone.')
    if (confirmed) {
      editor.selectAll()
      editor.deleteShapes(editor.getSelectedShapeIds())
    }
  }

  const fitToContent = () => {
    if (!editor) return
    editor.zoomToFit()
  }

  return (
    <div className="settings-modal-backdrop fixed inset-0 flex items-center justify-center z-50">
      <div className="settings-modal rounded-lg shadow-xl p-6 w-96 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">⚙️ Board Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">📤 Export Board</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'png' | 'svg' | 'json')}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="png">PNG Image</option>
                  <option value="svg">SVG Vector</option>
                  <option value="json">JSON Data</option>
                </select>
              </div>
              <button
                onClick={handleExport}
                className="w-full btn-black py-2 px-4 rounded font-medium transition-all duration-200"
              >
                Download {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Board Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">🎯 Board Actions</h3>
            <div className="space-y-2">
              <button
                onClick={fitToContent}
                className="w-full btn-black-light py-2 px-4 rounded font-medium transition-all duration-200"
              >
                🔍 Fit to Content
              </button>
              <button
                onClick={clearBoard}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded font-medium transition-all duration-200"
              >
                🗑️ Clear Board
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <h4 className="text-sm font-medium text-gray-800 mb-1">💡 Pro Tips</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Use Ctrl/Cmd + Z to undo</li>
              <li>• Double-click to edit text</li>
              <li>• Hold Shift while drawing for straight lines</li>
              <li>• Use the hand tool to pan around</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-gray py-2 px-4 rounded font-medium transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 