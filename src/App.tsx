import { useState, useCallback } from 'react'
import { Tldraw, Editor, toRichText } from 'tldraw'
import { useSyncDemo } from '@tldraw/sync'
import 'tldraw/tldraw.css'
import './App.css'

// Mentor Board Components
import { MentorToolbar } from './components/MentorToolbar'
import { CollaborationPanel } from './components/CollaborationPanel'
import { BoardSettings } from './components/BoardSettings'
import { MentorChatPanel } from './components/MentorChatPanel'

function App() {
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [roomId, setRoomId] = useState(`mentor-board-${Date.now()}`)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Use sync for collaboration or local store
  const store = useSyncDemo({ 
    roomId: isCollaborating ? roomId : `local-${Date.now()}`
  })

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)
    
    // Add welcome message with dark cyan theme
    editor.createShape({
      type: 'text',
      x: 100,
      y: 100,
      props: {
        richText: toRichText('Welcome to The Mentor Board! 🎯\n\nStart collaborating, drawing, and mentoring!'),
        size: 'xl',
        color: 'light-blue',
      },
    })

    // Add some example shapes for mentoring with dark cyan colors
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

    editor.createShape({
      type: 'geo',
      x: 1000,
      y: 200,
      props: {
        geo: 'rectangle',
        w: 200,
        h: 100,
        color: 'violet',
        fill: 'semi',
        richText: toRichText('Blockers'),
      },
    })

    // Add feedback section
    editor.createShape({
      type: 'text',
      x: 100,
      y: 400,
      props: {
        richText: toRichText('💬 Feedback & Comments'),
        size: 'l',
        color: 'light-blue',
      },
    })
  }, [])

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
        // Create 1-on-1 template with dark cyan colors
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
        // Create feedback template with dark cyan colors
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
        // Create planning template with dark cyan colors
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

  return (
    <div className="mentor-board-container">
      {/* Top Toolbar */}
      <MentorToolbar 
        isCollaborating={isCollaborating}
        onToggleCollaboration={toggleCollaboration}
        onCreateNewRoom={createNewRoom}
        onAddTemplate={addMentorTemplate}
        onShowSettings={() => setShowSettings(true)}
        roomId={roomId}
      />

      {/* Main Canvas */}
      <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, bottom: 0 }}>
        <Tldraw 
          store={store}
          onMount={handleMount}
        />
      </div>

      {/* Custom Mentor Program Watermark */}
      <div className="mentor-watermark">
        made with the mentor program
      </div>

      {/* Collaboration Panel */}
      {isCollaborating && (
        <CollaborationPanel 
          roomId={roomId}
          editor={editor}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <BoardSettings 
          onClose={() => setShowSettings(false)}
          editor={editor}
        />
      )}

      {/* Mentor AI Chat Panel */}
      <MentorChatPanel editor={editor} />
    </div>
  )
}

export default App
