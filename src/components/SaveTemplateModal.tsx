import React, { useState } from 'react'
import { X, Save, Image, Globe, Lock } from 'lucide-react'
import { Editor } from '@tldraw/editor'
import { supabase } from '../lib/supabase'

interface SaveTemplateModalProps {
  editor: Editor | null
  onClose: () => void
  onSuccess: () => void
}

const TEMPLATE_CATEGORIES = [
  { value: 'mentoring', label: '🎯 Mentoring' },
  { value: 'feedback', label: '💬 Feedback' },
  { value: 'planning', label: '📋 Planning' },
  { value: 'brainstorming', label: '💡 Brainstorming' },
  { value: 'retrospective', label: '🔄 Retrospective' },
  { value: 'onboarding', label: '👋 Onboarding' },
  { value: 'custom', label: '⚙️ Custom' }
]

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  editor,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!editor || !name.trim()) {
      setError('Template name is required')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Get current board state
      const storeSnapshot = editor.store.getSnapshot()
      const camera = editor.getCamera()
      const viewport = editor.getViewportPageBounds()
      const shapes = editor.getCurrentPageShapes()

      if (shapes.length === 0) {
        setError('Cannot save empty board as template')
        return
      }

      const templateData = {
        storeSnapshot,
        camera,
        viewport: {
          x: viewport.x,
          y: viewport.y,
          width: viewport.width,
          height: viewport.height
        },
        shapes: shapes.map(shape => ({
          id: shape.id,
          type: shape.type,
          x: shape.x,
          y: shape.y,
          props: shape.props,
          rotation: shape.rotation
        })),
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          shapeCount: shapes.length
        }
      }

      console.log('💾 Saving template:', {
        name: name.trim(),
        category,
        isPublic,
        shapeCount: shapes.length
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to save templates')
        return
      }

      const { error: saveError } = await supabase
        .from('templates')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          category,
          template_data: templateData,
          is_public: isPublic,
          user_id: user.id
        })

      if (saveError) {
        console.error('Error saving template:', saveError)
        setError('Failed to save template. Please try again.')
        return
      }

      console.log('✅ Template saved successfully')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Save as Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 1-on-1 Meeting Template"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template is for..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TEMPLATE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {isPublic ? (
                <Globe size={16} className="text-blue-500" />
              ) : (
                <Lock size={16} className="text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isPublic ? 'Public Template' : 'Private Template'}
                </p>
                <p className="text-xs text-gray-500">
                  {isPublic 
                    ? 'Other users can see and use this template'
                    : 'Only you can see and use this template'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 