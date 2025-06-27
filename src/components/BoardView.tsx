import { useState, useCallback, useEffect } from 'react'
import { Tldraw, Editor, toRichText, createTLStore, defaultShapeUtils, defaultTools } from 'tldraw'
import { useSyncDemo } from '@tldraw/sync'
import 'tldraw/tldraw.css'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Template } from '../lib/supabase'
import { ArrowLeft, Save, Share, Users } from 'lucide-react'

// Mentor Board Components
import { MentorToolbar } from './MentorToolbar'
import { CollaborationPanel } from './CollaborationPanel'
import { BoardSettings } from './BoardSettings'
import { MentorChatPanel } from './MentorChatPanel'
import { TemplatesPanel } from './TemplatesPanel'
import { SaveTemplateModal } from './SaveTemplateModal'

interface BoardViewProps {
  boardId: string
  onBack: () => void
}

export const BoardView: React.FC<BoardViewProps> = ({ boardId, onBack }) => {
  const { user } = useAuth()
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [roomId, setRoomId] = useState(boardId)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Use sync for collaboration or local store
  const store = useSyncDemo({ 
    roomId: isCollaborating ? roomId : `board-${boardId}`
  })

  // Load board data and metadata
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('*')
          .eq('id', boardId)
          .single()

        if (error) throw error
        
        setBoardName(data.name)
        
        // If board has saved data, load it after editor mounts
        if (data.board_data && Object.keys(data.board_data).length > 0) {
          // We'll load this after the editor mounts
        }
      } catch (error) {
        console.error('Error loading board:', error)
      }
    }

    if (boardId && user) {
      loadBoardData()
    }
  }, [boardId, user])

  // Auto-save functionality
  useEffect(() => {
    if (!editor || !boardId) return

    const saveBoard = async () => {
      try {
        setSaving(true)
        
        // Get complete board state including all tldraw data
        const storeSnapshot = editor.store.getSnapshot()
        const camera = editor.getCamera()
        const viewport = editor.getViewportPageBounds()
        
        const boardData = {
          // Complete tldraw store snapshot for full state preservation
          storeSnapshot,
          // Additional metadata
          camera,
          viewport: {
            x: viewport.x,
            y: viewport.y,
            width: viewport.width,
            height: viewport.height
          },
          // Legacy shape data for backwards compatibility
          shapes: editor.getCurrentPageShapes().map(shape => ({
            id: shape.id,
            type: shape.type,
            x: shape.x,
            y: shape.y,
            props: shape.props,
            rotation: shape.rotation
          })),
          metadata: {
            version: '2.0',
            savedAt: new Date().toISOString(),
            shapeCount: editor.getCurrentPageShapes().length
          }
        }

        console.log('💾 Saving board data:', {
          boardId,
          shapeCount: boardData.shapes.length,
          storeKeys: Object.keys(storeSnapshot.store),
          timestamp: boardData.metadata.savedAt
        })

        const { error } = await supabase
          .from('boards')
          .update({
            board_data: boardData,
            updated_at: new Date().toISOString()
          })
          .eq('id', boardId)

        if (error) throw error
        setLastSaved(new Date())
        console.log('✅ Board saved successfully')
      } catch (error) {
        console.error('❌ Error saving board:', error)
      } finally {
        setSaving(false)
      }
    }

    // Auto-save every 30 seconds
    const interval = setInterval(saveBoard, 30000)

    // Save on shape changes (debounced)
    let saveTimeout: NodeJS.Timeout
    const handleChange = () => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(saveBoard, 2000)
    }

    const unsubscribe = editor.store.listen(handleChange)

    return () => {
      clearInterval(interval)
      clearTimeout(saveTimeout)
      unsubscribe()
    }
  }, [editor, boardId])

  // Focus the board when component mounts or when editor changes
  useEffect(() => {
    if (editor) {
      const focusBoard = () => {
        editor.focus()
      }
      
      // Focus immediately
      focusBoard()
      
      // Also focus when window regains focus
      window.addEventListener('focus', focusBoard)
      
      // Handle keyboard events to ensure focus
      const handleKeyDown = (e: KeyboardEvent) => {
        // If no input is focused and user starts typing, focus the board
        const activeElement = document.activeElement as HTMLElement
        if (!activeElement || 
            (activeElement.tagName !== 'INPUT' && 
             activeElement.tagName !== 'TEXTAREA' &&
             activeElement.contentEditable !== 'true')) {
          editor.focus()
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        window.removeEventListener('focus', focusBoard)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [editor])

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)
    
    // Focus the editor immediately
    setTimeout(() => {
      editor.focus()
    }, 100)
    
    // Load saved board data asynchronously
    const loadBoardData = async () => {
      try {
        console.log('🔄 Loading board data for:', boardId)
        
        const { data, error } = await supabase
          .from('boards')
          .select('board_data')
          .eq('id', boardId)
          .single()

        if (error) throw error
        
        if (data.board_data && Object.keys(data.board_data).length > 0) {
          console.log('📄 Found saved board data:', {
            hasStoreSnapshot: !!data.board_data.storeSnapshot,
            hasShapes: !!data.board_data.shapes,
            shapeCount: data.board_data.shapes?.length || 0,
            version: data.board_data.metadata?.version || 'legacy'
          })

          // Try to restore from complete store snapshot first (v2.0+)
          if (data.board_data.storeSnapshot) {
            try {
              console.log('🔄 Restoring from store snapshot...')
              editor.store.loadSnapshot(data.board_data.storeSnapshot)
              
              // Restore camera position
              if (data.board_data.camera) {
                editor.setCamera(data.board_data.camera)
              }
              
              console.log('✅ Board restored from store snapshot')
              return
            } catch (storeError) {
              console.warn('⚠️ Failed to restore from store snapshot, falling back to legacy method:', storeError)
            }
          }

          // Fallback: restore from legacy shape data
          if (data.board_data.shapes && data.board_data.shapes.length > 0) {
            console.log('🔄 Restoring from legacy shape data...')
            editor.batch(() => {
              const currentShapes = editor.getCurrentPageShapes()
              if (currentShapes.length > 0) {
                editor.deleteShapes(currentShapes.map(shape => shape.id))
              }

              // Create shapes from saved data
              data.board_data.shapes.forEach((shapeData: any, index: number) => {
                try {
                  editor.createShape({
                    type: shapeData.type,
                    x: shapeData.x || 0,
                    y: shapeData.y || 0,
                    props: shapeData.props || {},
                    rotation: shapeData.rotation || 0
                  })
                } catch (shapeError) {
                  console.error(`Error creating shape ${index}:`, shapeError)
                }
              })

              // Restore camera position if available
              if (data.board_data.camera) {
                editor.setCamera(data.board_data.camera)
              }
            })
            console.log('✅ Board restored from legacy shape data')
          }
        } else {
          console.log('📝 No saved data found, creating welcome board...')
          // Add welcome message for new boards
          editor.createShape({
            type: 'text',
            x: 100,
            y: 100,
            props: {
              richText: toRichText(`Welcome to ${boardName || 'Your Board'}! 🎯\n\nStart collaborating, drawing, and mentoring!`),
              size: 'xl',
              color: 'light-blue',
            },
          })

          // Add some example shapes for mentoring
          editor.createShape({
            type: 'geo',
            x: 500,
            y: 200,
            props: {
              geo: 'rectangle',
              w: 200,
              h: 100,
              color: 'light-blue',
              fill: 'semi',
              richText: toRichText('Ideas & Goals'),
            },
          })

          editor.createShape({
            type: 'geo',
            x: 750,
            y: 200,
            props: {
              geo: 'rectangle',
              w: 200,
              h: 100,
              color: 'blue',
              fill: 'semi',
              richText: toRichText('Action Items'),
            },
          })
          console.log('✅ Welcome board created')
        }
      } catch (error) {
        console.error('❌ Error loading board data:', error)
      }
    }

    loadBoardData()
  }, [boardId, boardName])

  const toggleCollaboration = useCallback(() => {
    setIsCollaborating(!isCollaborating)
  }, [isCollaborating])

  const createNewRoom = useCallback(() => {
    const newRoomId = `mentor-board-${Date.now()}`
    setRoomId(newRoomId)
    setIsCollaborating(true)
  }, [])

  const addMentorTemplate = useCallback((template: string) => {
    if (!editor) return

    const bounds = editor.getViewportPageBounds()
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2

    switch (template) {
      case '1on1':
        editor.createShape({
          type: 'text',
          x: centerX - 200,
          y: centerY - 150,
          props: {
            richText: toRichText('📅 1-on-1 Meeting\n\n• Wins this week\n• Challenges\n• Goals for next week\n• Career development'),
            size: 'm',
            color: 'light-blue',
          },
        })
        break
      case 'feedback':
        editor.createShape({
          type: 'geo',
          x: centerX - 100,
          y: centerY - 100,
          props: {
            geo: 'rectangle',
            w: 200,
            h: 200,
            color: 'light-blue',
            fill: 'semi',
            richText: toRichText('✅ What went well'),
          },
        })
        editor.createShape({
          type: 'geo',
          x: centerX + 150,
          y: centerY - 100,
          props: {
            geo: 'rectangle',
            w: 200,
            h: 200,
            color: 'blue',
            fill: 'semi',
            richText: toRichText('🔄 What to improve'),
          },
        })
        break
      case 'planning':
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
        const colors = ['light-blue', 'blue', 'light-blue', 'blue']
        quarters.forEach((quarter, index) => {
          editor.createShape({
            type: 'geo',
            x: centerX - 200 + (index * 120),
            y: centerY,
            props: {
              geo: 'rectangle',
              w: 100,
              h: 150,
              color: colors[index],
              fill: 'semi',
              richText: toRichText(quarter),
            },
          })
        })
        break
    }
  }, [editor])

  const manualSave = useCallback(async () => {
    if (!editor || !boardId) return

    try {
      setSaving(true)
      
      // Get complete board state including all tldraw data
      const storeSnapshot = editor.store.getSnapshot()
      const camera = editor.getCamera()
      const viewport = editor.getViewportPageBounds()
      
      const boardData = {
        // Complete tldraw store snapshot for full state preservation
        storeSnapshot,
        // Additional metadata
        camera,
        viewport: {
          x: viewport.x,
          y: viewport.y,
          width: viewport.width,
          height: viewport.height
        },
        // Legacy shape data for backwards compatibility
        shapes: editor.getCurrentPageShapes().map(shape => ({
          id: shape.id,
          type: shape.type,
          x: shape.x,
          y: shape.y,
          props: shape.props,
          rotation: shape.rotation
        })),
        metadata: {
          version: '2.0',
          savedAt: new Date().toISOString(),
          shapeCount: editor.getCurrentPageShapes().length,
          saveType: 'manual'
        }
      }

      console.log('💾 Manual save - board data:', {
        boardId,
        shapeCount: boardData.shapes.length,
        storeKeys: Object.keys(storeSnapshot.store),
        timestamp: boardData.metadata.savedAt
      })

      const { error } = await supabase
        .from('boards')
        .update({
          board_data: boardData,
          updated_at: new Date().toISOString()
        })
        .eq('id', boardId)

      if (error) throw error
      setLastSaved(new Date())
      console.log('✅ Manual save completed successfully')
    } catch (error) {
      console.error('❌ Error manually saving board:', error)
    } finally {
      setSaving(false)
    }
  }, [editor, boardId])

  // Template functions
  const handleSaveTemplate = useCallback(() => {
    setShowSaveTemplate(true)
  }, [])

  const handleLoadTemplate = useCallback(async (template: Template) => {
    if (!editor) return

    try {
      console.log('🔄 Loading template:', template.name)

      // Clear existing shapes first
      const currentShapes = editor.getCurrentPageShapes()
      if (currentShapes.length > 0) {
        editor.deleteShapes(currentShapes.map(shape => shape.id))
      }

      // Try to restore from complete store snapshot first (v2.0+)
      if (template.template_data.storeSnapshot) {
        try {
          console.log('🔄 Restoring template from store snapshot...')
          editor.store.loadSnapshot(template.template_data.storeSnapshot)
          
          // Restore camera position
          if (template.template_data.camera) {
            editor.setCamera(template.template_data.camera)
          }
          
          console.log('✅ Template loaded from store snapshot')
          return
        } catch (storeError) {
          console.warn('⚠️ Failed to restore template from store snapshot, falling back to legacy method:', storeError)
        }
      }

      // Fallback: restore from legacy shape data
      if (template.template_data.shapes && template.template_data.shapes.length > 0) {
        console.log('🔄 Restoring template from legacy shape data...')
        editor.batch(() => {
          template.template_data.shapes.forEach((shapeData: any, index: number) => {
            try {
              editor.createShape({
                type: shapeData.type,
                x: shapeData.x || 0,
                y: shapeData.y || 0,
                props: shapeData.props || {},
                rotation: shapeData.rotation || 0
              })
            } catch (shapeError) {
              console.error(`Error creating template shape ${index}:`, shapeError)
            }
          })

          // Restore camera position if available
          if (template.template_data.camera) {
            editor.setCamera(template.template_data.camera)
          }
        })
        console.log('✅ Template loaded from legacy shape data')
      }
    } catch (error) {
      console.error('❌ Error loading template:', error)
    }
  }, [editor])

  const handleTemplateSuccess = useCallback(() => {
    // Refresh templates in the panel if needed
    console.log('✅ Template saved successfully')
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Top Bar - Above Board */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-lg font-semibold text-gray-900">{boardName}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {saving ? (
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </span>
            ) : lastSaved ? (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            ) : (
              <span>Ready</span>
            )}
          </div>
          
          <button
            onClick={manualSave}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            disabled={saving}
          >
            <Save size={14} />
            <span>Save</span>
          </button>

          <button
            onClick={toggleCollaboration}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded transition-colors ${
              isCollaborating 
                ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={14} />
            <span>{isCollaborating ? 'Collaborating' : 'Solo'}</span>
          </button>
        </div>
      </header>

      {/* Board Area */}
      <div 
        className="flex-1 relative"
        onClick={() => editor?.focus()}
      >
        <Tldraw
          store={store}
          onMount={handleMount}
        />

        {/* Templates & Actions - Middle Left Icon */}
        <TemplatesPanel
          onAddTemplate={addMentorTemplate}
          onToggleCollaboration={toggleCollaboration}
          isCollaborating={isCollaborating}
          onCreateNewRoom={createNewRoom}
          onShowSettings={() => setShowSettings(!showSettings)}
          onPrintBoard={() => console.log('Board data:', editor?.getCurrentPageShapes())}
          onSaveTemplate={handleSaveTemplate}
          onLoadTemplate={handleLoadTemplate}
          roomId={roomId}
        />

        {/* Floating Collaboration Panel */}
        {isCollaborating && (
          <div className="absolute left-4 bottom-20 z-40">
            <CollaborationPanel 
              roomId={roomId}
              editor={editor}
            />
          </div>
        )}

        {/* Board Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 z-50">
            <BoardSettings 
              onClose={() => setShowSettings(false)}
              editor={editor}
            />
          </div>
        )}

        {/* Floating Mentor Chat Panel */}
        <div className="absolute bottom-4 right-4 z-[9999]">
          <MentorChatPanel editor={editor} boardId={boardId} />
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <SaveTemplateModal
          editor={editor}
          onClose={() => setShowSaveTemplate(false)}
          onSuccess={handleTemplateSuccess}
        />
      )}
    </div>
  )
} 