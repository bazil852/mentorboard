import React, { useState, useEffect } from 'react'
import { Layers, Settings, Users, Rocket, Bug, Plus, Bookmark, Globe, Lock, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Template } from '../lib/supabase'

interface TemplatesPanelProps {
  isCollaborating: boolean
  onToggleCollaboration: () => void
  onCreateNewRoom: () => void
  onAddTemplate: (template: string) => void
  onShowSettings: () => void
  onPrintBoard: () => void
  onSaveTemplate: () => void
  onLoadTemplate: (template: Template) => void
  roomId: string
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  isCollaborating,
  onToggleCollaboration,
  onCreateNewRoom,
  onAddTemplate,
  onShowSettings,
  onPrintBoard,
  onSaveTemplate,
  onLoadTemplate,
  roomId
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'builtin' | 'saved'>('builtin')

  // Load templates from database
  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('usage_count', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load templates when panel expands
  useEffect(() => {
    if (isExpanded && activeTab === 'saved') {
      loadTemplates()
    }
  }, [isExpanded, activeTab])

  const handleLoadTemplate = async (template: Template) => {
    try {
      // Track template usage
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('template_usage').insert({
          template_id: template.id,
          user_id: user.id
        })

        // Increment usage count
        await supabase.rpc('increment_template_usage', {
          template_uuid: template.id
        })
      }

      onLoadTemplate(template)
      setIsExpanded(false)
    } catch (error) {
      console.error('Error loading template:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Icon toggle button
  const toggleButton = (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-105"
      title="Open Templates & Actions"
    >
      <Layers size={20} className="text-gray-700" />
    </button>
  )

  // Expanded panel
  const expandedPanel = (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3 space-y-3 min-w-[320px] max-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Templates & Actions</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 text-lg font-bold transition-colors"
        >
          ×
        </button>
      </div>

      {/* Room Status */}
      {isCollaborating && (
        <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
          🌐 Room: {roomId.split('-').pop()}
        </div>
      )}

      {/* Save Template Button */}
      <button
        onClick={onSaveTemplate}
        className="w-full flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-200"
      >
        <Plus size={16} />
        <span>Save Current Board as Template</span>
      </button>

      {/* Template Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('builtin')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'builtin'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Built-in
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'saved'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Saved ({templates.length})
        </button>
      </div>

      {/* Templates Section */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activeTab === 'builtin' ? (
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
        ) : (
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-500">Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Bookmark size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved templates yet</p>
                <p className="text-xs">Save your current board as a template to see it here</p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {template.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {template.is_public ? (
                            <div title="Public template">
                              <Globe size={12} className="text-blue-500" />
                            </div>
                          ) : (
                            <div title="Private template">
                              <Lock size={12} className="text-gray-400" />
                            </div>
                          )}
                          {template.usage_count > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <TrendingUp size={10} />
                              <span>{template.usage_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {template.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {template.category}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock size={10} />
                          <span>{formatDate(template.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadTemplate(template)}
                    className="w-full mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-3 rounded text-xs font-medium transition-colors"
                  >
                    Load Template
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700">Actions</h4>
        <div className="space-y-2">
          <button
            onClick={onToggleCollaboration}
            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCollaborating
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={16} />
            <span>{isCollaborating ? 'Collaborating' : 'Start Collaboration'}</span>
          </button>
          
          {!isCollaborating && (
            <button
              onClick={onCreateNewRoom}
              className="w-full flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Rocket size={16} />
              <span>New Room</span>
            </button>
          )}

          <button
            onClick={onShowSettings}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>

          <button
            onClick={onPrintBoard}
            className="w-full flex items-center justify-center space-x-2 bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            title="Print current board data to console"
          >
            <Bug size={16} />
            <span>Debug Print</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40">
      {isExpanded ? expandedPanel : toggleButton}
    </div>
  )
} 