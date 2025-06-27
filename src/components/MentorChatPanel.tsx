import React, { useState, useRef, useEffect } from 'react'
import { Editor, toRichText } from 'tldraw'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { BoardChat, BoardImage } from '../lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MentorChatPanelProps {
  editor: Editor | null
  boardId: string
}

// Component to format chat messages with better styling
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const formatMessage = (text: string) => {
    // Split by lines and process each line
    const lines = text.split('\n')
    const formattedLines: JSX.Element[] = []
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      if (!trimmedLine) {
        formattedLines.push(<br key={`br-${index}`} />)
        return
      }
      
      // Headers (lines starting with numbers followed by asterisks)
      if (/^\d+\.\s*\*\*.*\*\*:?$/.test(trimmedLine)) {
        const headerText = trimmedLine.replace(/^\d+\.\s*\*\*(.*)\*\*:?$/, '$1')
        formattedLines.push(
          <div key={index} className="font-bold text-blue-600 mt-3 mb-2 text-sm">
            {headerText}
          </div>
        )
      }
      // Sub-items (lines with bullet points or dashes)
      else if (/^\s*[-•]\s/.test(trimmedLine)) {
        const itemText = trimmedLine.replace(/^\s*[-•]\s/, '')
        formattedLines.push(
          <div key={index} className="ml-4 mb-1 text-gray-700 text-sm flex items-start">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span>{itemText}</span>
          </div>
        )
      }
      // Bold text (surrounded by **)
      else if (/\*\*.*\*\*/.test(trimmedLine)) {
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/)
        formattedLines.push(
          <div key={index} className="mb-2 text-sm">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <span key={partIndex} className="font-semibold text-gray-800">
                    {part.slice(2, -2)}
                  </span>
                )
              }
              return <span key={partIndex}>{part}</span>
            })}
          </div>
        )
      }
      // Regular text
      else {
        formattedLines.push(
          <div key={index} className="mb-2 text-sm text-gray-700">
            {trimmedLine}
          </div>
        )
      }
    })
    
    return formattedLines
  }

  return <div className="space-y-1">{formatMessage(content)}</div>
}

export const MentorChatPanel: React.FC<MentorChatPanelProps> = ({ editor, boardId }) => {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeMode, setActiveMode] = useState<'chat' | 'script'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [scriptContent, setScriptContent] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<BoardImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load chat history when component mounts or boardId changes
  useEffect(() => {
    if (boardId && user) {
      loadChatHistory()
    }
  }, [boardId, user])

  const loadChatHistory = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading chat history for board:', boardId)

      const { data, error } = await supabase
        .from('board_chats')
        .select('*')
        .eq('board_id', boardId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      const loadedMessages: Message[] = data.map((chat: BoardChat) => ({
        id: chat.id,
        role: chat.message_type,
        content: chat.content,
        timestamp: new Date(chat.created_at)
      }))

      // Add welcome message if no chat history exists
      if (loadedMessages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I\'m your Mentor AI assistant. I can help you with mentoring strategies, provide feedback, and even generate content directly on your board. How can I assist you today?',
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      } else {
        setMessages(loadedMessages)
        console.log(`✅ Loaded ${loadedMessages.length} chat messages`)
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error)
      // Set welcome message on error
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your Mentor AI assistant. I can help you with mentoring strategies, provide feedback, and even generate content directly on your board. How can I assist you today?',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } finally {
      setLoading(false)
    }
  }

  const saveChatMessage = async (message: Message) => {
    if (!user || !boardId || message.id === 'welcome') return

    try {
      const { error } = await supabase
        .from('board_chats')
        .insert({
          board_id: boardId,
          user_id: user.id,
          message_type: message.role,
          content: message.content,
          metadata: {
            timestamp: message.timestamp.toISOString()
          }
        })

      if (error) throw error
      console.log('💾 Chat message saved to database')
    } catch (error) {
      console.error('❌ Error saving chat message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !user) return

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) return

    setUploadingImages(true)
    
    try {
      console.log(`📸 Uploading ${imageFiles.length} images to storage...`)
      
      const uploadPromises = imageFiles.map(async (file) => {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${boardId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `board-images/${fileName}`

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('board-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('board-images')
          .getPublicUrl(filePath)

        // Get image dimensions
        const dimensions = await getImageDimensions(file)

        // Save to database
        const { data: imageRecord, error: dbError } = await supabase
          .from('board_images')
          .insert({
            board_id: boardId,
            user_id: user.id,
            filename: file.name,
            storage_path: filePath,
            storage_url: publicUrlData.publicUrl,
            content_type: file.type,
            file_size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            metadata: {
              originalName: file.name,
              uploadedAt: new Date().toISOString()
            }
          })
          .select()
          .single()

        if (dbError) throw dbError

        console.log(`✅ Image uploaded: ${file.name}`)
        return imageRecord as BoardImage
      })

      const uploadedImageRecords = await Promise.all(uploadPromises)
      
      setUploadedImageUrls(prev => [...prev, ...uploadedImageRecords])
      setUploadedImages(prev => [...prev, ...imageFiles])
      
      console.log(`🎉 Successfully uploaded ${uploadedImageRecords.length} images`)
    } catch (error) {
      console.error('❌ Error uploading images:', error)
      // Could add toast notification here
    } finally {
      setUploadingImages(false)
    }
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        resolve({ width: 0, height: 0 })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const removeImage = (index: number) => {
    const imageToRemove = uploadedImageUrls[index]
    
    // Remove from storage and database
    if (imageToRemove) {
      supabase.storage
        .from('board-images')
        .remove([imageToRemove.storage_path])
        .then(() => {
          return supabase
            .from('board_images')
            .delete()
            .eq('id', imageToRemove.id)
        })
        .then(() => {
          console.log(`🗑️ Removed image: ${imageToRemove.filename}`)
        })
        .catch((error) => {
          console.error('❌ Error removing image:', error)
        })
    }

    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const getBoardContext = () => {
    if (!editor) return null
    
    try {
      const shapes = editor.getCurrentPageShapes()
      const boardData = {
        shapeCount: shapes.length,
        shapeTypes: shapes.map(shape => shape.type),
        hasContent: shapes.length > 0,
        bounds: editor.getSelectionPageBounds()
      }
      return boardData
    } catch (error) {
      console.error('Error getting board context:', error)
      return null
    }
  }

  const createBoardShape = async (shapes: any[]) => {
    if (!editor || !shapes || shapes.length === 0) return

    try {
      editor.batch(() => {
        const bounds = editor.getViewportPageBounds()
        const centerX = bounds.x + bounds.width / 2
        const centerY = bounds.y + bounds.height / 2

        shapes.forEach((shapeData, index) => {
        const offsetX = (index % 3) * 250 // Spread shapes horizontally
        const offsetY = Math.floor(index / 3) * 150 // Spread shapes vertically
        
        const x = shapeData.x || (centerX + offsetX - 250)
        const y = shapeData.y || (centerY + offsetY - 75)

        switch (shapeData.type) {
          case 'text':
            editor.createShape({
              type: 'text',
              x,
              y,
              props: {
                richText: toRichText(shapeData.content || 'Generated content'),
                size: shapeData.size || 'm',
                color: shapeData.color || 'black'
              }
            })
            break

          case 'note':
            editor.createShape({
              type: 'note',
              x,
              y,
              props: {
                size: shapeData.size || 'm',
                color: shapeData.color || 'yellow',
                richText: toRichText(shapeData.content || 'Generated note')
              }
            })
            break

          case 'rectangle':
          case 'geo':
            editor.createShape({
              type: 'geo',
              x,
              y,
              props: {
                w: shapeData.width || 200,
                h: shapeData.height || 100,
                geo: shapeData.geo || 'rectangle',
                color: shapeData.color || 'blue',
                fill: shapeData.fill || 'semi',
                richText: toRichText(shapeData.content || '')
              }
            })
            break

          case 'arrow':
            editor.createShape({
              type: 'arrow',
              x,
              y,
              props: {
                start: { x: 0, y: 0 },
                end: { x: shapeData.length || 100, y: 0 },
                color: shapeData.color || 'black',
                size: shapeData.size || 'm'
              }
            })
            break

          default:
            // Default to text if type is not recognized
            editor.createShape({
              type: 'text',
              x,
              y,
              props: {
                text: shapeData.content || shapeData.text || 'Generated content',
                size: 'm',
                color: 'black'
              }
            })
        }
              })

        // Zoom to fit the new content
        setTimeout(() => {
          editor.zoomToFit()
        }, 100)
      })

    } catch (error) {
      console.error('Error creating board shapes:', error)
    }
  }

  const updateEntireBoard = async (boardData: any) => {
    if (!editor || !boardData.board?.shapes) {
      console.error('❌ Cannot update board: missing editor or shapes data', { editor: !!editor, shapes: boardData.board?.shapes })
      return
    }

    console.log('🔄 Updating entire board with data:', boardData)
    console.log('📝 Shapes to create:', boardData.board.shapes)

    try {
      editor.batch(() => {
        // First, clear all existing shapes
        const currentShapes = editor.getCurrentPageShapes()
        console.log(`🗑️ Clearing ${currentShapes.length} existing shapes`)
        if (currentShapes.length > 0) {
          editor.deleteShapes(currentShapes.map(shape => shape.id))
        }

        // Then create all new shapes from the board data
        console.log(`🎨 Creating ${boardData.board.shapes.length} new shapes`)
        boardData.board.shapes.forEach((shapeData: any, index: number) => {
          const x = shapeData.x || (100 + (index * 20))
          const y = shapeData.y || (100 + (index * 20))

          switch (shapeData.type) {
            case 'text':
              editor.createShape({
                type: 'text',
                x,
                y,
                props: {
                  richText: toRichText(shapeData.content || 'Generated content'),
                  size: shapeData.size || 'm',
                  color: shapeData.color || 'black'
                }
              })
              break

            case 'note':
              editor.createShape({
                type: 'note',
                x,
                y,
                props: {
                  size: shapeData.size || 'm',
                  color: shapeData.color || 'yellow',
                  richText: toRichText(shapeData.content || 'Generated note')
                }
              })
              break

            case 'rectangle':
            case 'geo':
              editor.createShape({
                type: 'geo',
                x,
                y,
                props: {
                  w: shapeData.width || 200,
                  h: shapeData.height || 100,
                  geo: shapeData.geo || 'rectangle',
                  color: shapeData.color || 'blue',
                  fill: shapeData.fill || 'semi',
                  richText: toRichText(shapeData.content || '')
                }
              })
              break

            case 'arrow':
              editor.createShape({
                type: 'arrow',
                x,
                y,
                props: {
                  start: { x: 0, y: 0 },
                  end: { x: shapeData.length || 100, y: 0 },
                  color: shapeData.color || 'black',
                  size: shapeData.size || 'm'
                }
              })
              break

            default:
              // Default to text if type is not recognized
              editor.createShape({
                type: 'text',
                x,
                y,
                props: {
                  richText: toRichText(shapeData.content || shapeData.text || 'Generated content'),
                  size: 'm',
                  color: 'black'
                }
              })
          }
        })

        // Apply alignment for perfect positioning (fallback if coordinates aren't perfect)
        setTimeout(() => {
          const allShapes = editor.getCurrentPageShapes()
          if (allShapes.length > 1) {
            // Group shapes by y-coordinate to align horizontally flowing elements
            const shapesByRow = new Map<number, any[]>()
            allShapes.forEach(shape => {
              const roundedY = Math.round(shape.y / 100) * 100 // Group by 100px intervals
              if (!shapesByRow.has(roundedY)) shapesByRow.set(roundedY, [])
              shapesByRow.get(roundedY)!.push(shape)
            })
            
            // Align shapes in each row
            shapesByRow.forEach(rowShapes => {
              if (rowShapes.length > 1) {
                editor.selectNone()
                editor.setSelectedShapes(rowShapes.map(s => s.id))
                editor.alignShapes(editor.getSelectedShapeIds(), 'center-vertical')
                if (rowShapes.length > 2) {
                  editor.distributeShapes(editor.getSelectedShapeIds(), 'horizontal')
                }
              }
            })
            editor.selectNone()
          }
          
          // Zoom to fit the new content
          editor.zoomToFit()
          console.log('✅ Board update completed successfully with alignment')
        }, 100)
      })

    } catch (error) {
      console.error('❌ Error updating board:', error)
      throw error // Re-throw to handle in calling function
    }
  }

  const processScript = async () => {
    if (!scriptContent.trim() || isLoading) return

    setIsLoading(true)

    try {
      const boardContext = getBoardContext()
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
      }

      // Use uploaded image URLs for analysis
      const imageAnalysisArray = uploadedImageUrls.map((imageRecord) => ({
        type: "image_url",
        image_url: {
          url: imageRecord.storage_url,
          detail: "high"
        }
      }))

      // Include image metadata for better AI understanding
      const imageContext = uploadedImageUrls.length > 0 ? 
        `\n\nUploaded Images Context:\n${uploadedImageUrls.map((img, i) => 
          `Image ${i + 1}: ${img.filename} (${img.width}x${img.height}px, ${Math.round(img.file_size / 1024)}KB)`
        ).join('\n')}` : ''

      const systemPrompt = `
      You are **MentorAI**, a layout-savvy assistant that turns scripts + screenshots into a *tldraw* storyboard with a fixed LEFT → MIDDLE → RIGHT flow.
      
      ────────────────────────
      CANVAS SNAPSHOT
      ────────────────────────
      • Existing shapes:  ${boardContext?.shapeCount ?? 0}
      • Types on canvas:  ${boardContext?.shapeTypes?.join(', ') || 'none'}
      • Uploaded images: ${uploadedImageUrls.length} (URLs available for placement)
      
      ────────────────────────
      STYLE & LAYOUT PATTERN
      ────────────────────────
      1. **LEFT COLUMN (SOURCE MEDIA)**
         • Wrap all screenshots / images in one solid black rectangle
           – rectangle.x ≈ -1900, w ≈ 830, h = (numImages * 450) + 100
         • Stack each image inside, x ≈ -1720 ; y starts at -1650 and steps ↓ 480
         • Optional tiny heading (size xl) at y = first image.y - 60
      
      2. **CENTER (NARRATIVE)**
         • Main arrow exits rectangle’s centre → points right
         • Place headline text at x ≈ -150, y aligned with that arrow
         • Second arrow continues → points to bullet list block
         • Bullet list text box at x ≈ 900, y ≈ headline.y – 50
           – set props.textAlign = "middle", scale ~0.55 if > 3 bullets
      
      3. **RIGHT COLUMN (CALL-TO-ACTIONS)**
         • Three parallel arrows leave bullet list → CTA texts
         • Draw CTA texts (size xl) at x ≈ 1060 / 1100…1200, y spaced -1150 / -900 / -700
         • Optional large rectangle behind CTAs at x ≈ 2100 to group them
      
      4. **COLOURS & SIZES**
         • Solid black outlines for rectangles & arrows
         • Text / note colours: keep default black unless script specifies mood
         • Arrow size = xl, text size = xl
      
      5. **GENERAL RULES**
         • Stick to template fields only (id auto-generated by caller)
         • Rich text strings may be plain; caller wraps with toRichText()
         • Output **one JSON object, no markdown fences or extra text**
      
      ────────────────────────
      JSON RESPONSE FORMAT  –  STRICT!
      ────────────────────────
      {
        "action": "create_shapes",
        "shapes": [ /* one or many shapes, using templates below */ ],
        "explanation": "≤ 20 words summarising what you drew"
      }
      
      Templates (copy exactly; omit props you don’t use):
      
      • Rectangle / Group box
        {
          "type": "geo",
          "x": <number>, "y": <number>,
          "props": { "w": <number>, "h": <number>, "geo": "rectangle",
                     "fill": "solid", "color": "black", "dash": "draw", "size": "m|xl" }
        }
      
      • Image (use uploaded image URLs)
        { "type": "image", "x": <number>, "y": <number>,
          "props": { "w": <number>, "h": <number>, "src": "${uploadedImageUrls[0]?.storage_url || 'IMAGE_URL'}", "crop": null } }
      
      • Text
        { "type": "text", "x": <number>, "y": <number>,
          "props": { "size": "xl", "color": "black",
                     "autoSize": true, "richText": "<string or bulletList JSON>" } }
      
      • Arrow
        { "type": "arrow", "x": <number>, "y": <number>,
          "props": { "kind": "arc", "size": "xl", "color": "black",
                     "start": { "x": 0, "y": 0 },
                     "end":   { "x": <dx>, "y": <dy> },
                     "arrowheadEnd": "arrow" } }
      
      ────────────────────────
      TASK
      ────────────────────────
      Use the style above to turn the user’s script and screenshots into a board.  
      Respond **only** with the JSON object.`;
      
      
      const content = [
        { type: "text", text: `Script to visualize:\n\n${scriptContent}${imageContext}` },
        ...imageAnalysisArray
      ]

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: content }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const assistantResponse = data.choices[0]?.message?.content || 'Sorry, I encountered an error.'

      // Try to parse and create shapes
      try {
        const jsonMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          const jsonString = jsonMatch[1]
          const boardData = JSON.parse(jsonString)
          
          if (boardData.action === 'create_shapes' && boardData.shapes) {
            await createBoardShape(boardData.shapes)
            
            // Add success message to chat
            const successMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `✅ Board visualization created! ${boardData.explanation || 'Visual representation has been generated from your script and images.'}`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, successMessage])
            
            // Clear the script and images
            setScriptContent('')
            setUploadedImages([])
            setUploadedImageUrls([])
          }
        } else {
          throw new Error('No valid visualization JSON found in response')
        }
      } catch (parseError) {
        console.error('Error parsing visualization response:', parseError)
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error creating visualization: ${parseError instanceof Error ? parseError.message : 'Failed to parse response'}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }

    } catch (error) {
      console.error('Error processing script:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process script.'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Save user message to database
    await saveChatMessage(userMessage)

    try {
      const boardContext = getBoardContext()
      
      // Get detailed board context
      const currentShapes = editor?.getCurrentPageShapes() || []
      const boardSummary = {
        shapeCount: currentShapes.length,
        shapes: currentShapes.map(shape => ({
          id: shape.id,
          type: shape.type,
          x: Math.round(shape.x),
          y: Math.round(shape.y),
          // Extract text content from shape props
          content: (() => {
            try {
              if (shape.type === 'text' && (shape.props as any).richText) {
                return (shape.props as any).richText.text || 'Text shape'
              }
              if (shape.type === 'note' && (shape.props as any).richText) {
                return (shape.props as any).richText.text || 'Note shape'
              }
              if (shape.type === 'geo' && (shape.props as any).richText) {
                return (shape.props as any).richText.text || `${(shape.props as any).geo || 'shape'}`
              }
              return `${shape.type} shape`
            } catch {
              return `${shape.type} shape`
            }
          })(),
          props: shape.props
        })),
        viewport: editor ? {
          camera: editor.getCamera(),
          bounds: editor.getViewportPageBounds()
        } : null
      }

      const systemPrompt = `You are a Mentor AI assistant helping with mentoring and coaching activities. You have access to a collaborative whiteboard (tldraw) where you can help users create content.

CURRENT BOARD STATE:
${JSON.stringify(boardSummary, null, 2)}

BOARD ANALYSIS:
- Total shapes: ${boardSummary.shapeCount}
- Shape types present: ${[...new Set(currentShapes.map(s => s.type))].join(', ') || 'none'}
- Content summary: ${currentShapes.length > 0 ? currentShapes.map(s => {
  try {
    if (s.type === 'text' && (s.props as any).richText?.text) return `"${(s.props as any).richText.text.substring(0, 50)}"`
    if (s.type === 'note' && (s.props as any).richText?.text) return `Note: "${(s.props as any).richText.text.substring(0, 50)}"`
    if (s.type === 'geo' && (s.props as any).richText?.text) return `${(s.props as any).geo}: "${(s.props as any).richText.text.substring(0, 50)}"`
    return s.type
  } catch {
    return s.type
  }
}).slice(0, 5).join(', ') : 'empty board'}

BOARD MANAGEMENT CAPABILITY:
When users ask you to create, add, generate, draw, update, modify, or change content on the board, you MUST respond with a JSON object containing the COMPLETE board state. You should return ALL shapes that should exist on the board (both existing and new ones).

**DETECTION KEYWORDS:** create, add, generate, draw, make, build, put on board, add to board, show on board, update, modify, change, edit, replace

**RESPONSE FORMAT for board updates:**
\`\`\`json
{
  "action": "update_board",
  "board": {
    "shapes": [
      {
        "type": "text|note|rectangle|geo|arrow",
        "content": "text content here",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 100,
        "color": "blue|black|red|yellow|green|orange|violet|light-blue",
        "size": "s|m|l|xl",
        "fill": "none|semi|solid",
        "geo": "rectangle|ellipse|triangle|diamond"
      }
    ]
  },
  "explanation": "Brief explanation of what was changed"
}
\`\`\`

**IMPORTANT INSTRUCTIONS:** ONLY RETURN THE JSON OBJECT, NO OTHER TEXT.
1. ALWAYS return the COMPLETE board state with ALL shapes (existing + new + modified)
2. If user wants to ADD something, include all existing shapes PLUS the new ones
3. If user wants to MODIFY something, include all shapes with the modifications applied
4. If user wants to DELETE something, include all shapes EXCEPT the deleted ones
5. Maintain the positioning and properties of existing shapes unless specifically asked to change them
6. Use the current board state as your starting point and apply the requested changes

**AVAILABLE SHAPE TYPES:**
1. **text** - Simple text labels, titles, notes
2. **note** - Sticky notes (built-in tldraw note shapes)
3. **rectangle/geo** - Shapes with text inside (rectangles, circles, etc.)
4. **arrow** - Connecting arrows between elements

**COORDINATE RULES (STRICT!) - PREVENT DRIFT:**
To ensure perfect alignment and eliminate visual drift, use these coordinate patterns:

**For horizontal flows (processes, timelines):**
- All process boxes: y = -900 (same level)
- First box x = -1700, then add +500 for each next box
- Box dimensions: width = 350, height = 180 (consistent sizing)
- Arrow placement: x = previousBox.x + 350, y = -900
- Arrow length: end: { "x": 150, "y": 0 }
- Header text: x = -1650, y = -1150

**For vertical flows (hierarchies, breakdowns):**
- Column headers: y = -1000, spaced x = -800, -400, 0, 400, 800
- First row items: y = -700, same x positions as headers
- Each subsequent row: y = previousRow.y + 300

**For grid layouts (categories, frameworks):**
- Top-left anchor: x = -600, y = -600
- Grid spacing: +400 horizontal, +300 vertical
- 2x2 grid: (-600,-600), (-200,-600), (-600,-300), (-200,-300)
- 3x2 grid: add (200,-600), (200,-300)

**SHAPE PROPERTIES:**
- type: "text" | "note" | "rectangle" | "geo" | "arrow"
- content: Text content to display (will be converted to richText automatically)
- color: "black" | "blue" | "red" | "yellow" | "green" | "orange" | "violet" | "light-blue" 
- size: "s" | "m" | "l" | "xl" (for text/notes)
- width/height: Use coordinate rules above for consistent sizing
- fill: "none" | "semi" | "solid" (for geo shapes)
- geo: "rectangle" | "ellipse" | "triangle" | "diamond" (for geo type)

**IMPORTANT:** All text content is automatically converted to richText format using toRichText()

**ALIGNMENT GUARANTEE:**
If you follow the coordinate rules above, shapes will be perfectly aligned. Alternatively, the system can apply editor.align("center") and editor.distribute("horizontal") after shape creation for automatic alignment.

**EXAMPLE REQUESTS & RESPONSES:**

User: "Create a SWOT analysis on the board" (when board is empty)
Response:
\`\`\`json
{
  "action": "update_board",
  "board": {
    "shapes": [
      {"type": "text", "content": "SWOT Analysis", "x": -400, "y": -1150, "size": "xl", "color": "black"},
      {"type": "rectangle", "content": "Strengths", "x": -600, "y": -600, "width": 350, "height": 180, "color": "green", "fill": "semi"},
      {"type": "rectangle", "content": "Weaknesses", "x": -200, "y": -600, "width": 350, "height": 180, "color": "red", "fill": "semi"},
      {"type": "rectangle", "content": "Opportunities", "x": -600, "y": -300, "width": 350, "height": 180, "color": "blue", "fill": "semi"},
      {"type": "rectangle", "content": "Threats", "x": -200, "y": -300, "width": 350, "height": 180, "color": "orange", "fill": "semi"}
    ]
  },
  "explanation": "Created a complete SWOT analysis framework with title and four quadrants using grid layout."
}
\`\`\`

User: "Add some action items as sticky notes" (when SWOT already exists)
Response:
\`\`\`json
{
  "action": "update_board",
  "board": {
    "shapes": [
      {"type": "text", "content": "SWOT Analysis", "x": -400, "y": -1150, "size": "xl", "color": "black"},
      {"type": "rectangle", "content": "Strengths", "x": -600, "y": -600, "width": 350, "height": 180, "color": "green", "fill": "semi"},
      {"type": "rectangle", "content": "Weaknesses", "x": -200, "y": -600, "width": 350, "height": 180, "color": "red", "fill": "semi"},
      {"type": "rectangle", "content": "Opportunities", "x": -600, "y": -300, "width": 350, "height": 180, "color": "blue", "fill": "semi"},
      {"type": "rectangle", "content": "Threats", "x": -200, "y": -300, "width": 350, "height": 180, "color": "orange", "fill": "semi"},
      {"type": "note", "content": "Follow up with team", "x": 200, "y": -600, "color": "yellow"},
      {"type": "note", "content": "Schedule next meeting", "x": 200, "y": -450, "color": "yellow"},
      {"type": "note", "content": "Review project timeline", "x": 200, "y": -300, "color": "orange"}
    ]
  },
  "explanation": "Added three action item sticky notes in a vertical column while preserving the existing SWOT analysis."
}
\`\`\`

MENTORING FOCUS:
- Provide mentoring and coaching advice
- Help with 1-on-1 conversations  
- Suggest feedback frameworks
- Create structured templates
- Facilitate learning and development discussions

IMPORTANT: 
- If user asks to create/add/generate content on board, respond with JSON format above
- For regular conversation, respond normally
- Always be helpful and focus on mentoring best practices`

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            // Include last 3 message exchanges (up to 6 messages total)
            ...messages.slice(-6).map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ],
          max_tokens: 5000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || 'Sorry, I encountered an error.'
      
      // Console log the OpenAI response
      console.group('🤖 OpenAI Response')
      console.log('User Message:', inputMessage)
      console.log('Board Context Sent:', boardSummary)
      console.log('AI Response:', aiResponse)
      console.groupEnd()
      
      // Check if the AI response contains JSON for board creation
      let isJsonResponse = false
      let displayContent = aiResponse
      
      try {
        // Look for JSON code blocks
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          const jsonString = jsonMatch[1]
          const boardData = JSON.parse(jsonString)
          
          console.log('🎯 Detected JSON board update:', boardData)
          
          if (boardData.action === 'update_board' && boardData.board?.shapes) {
            // Update the entire board with the new state
            isJsonResponse = true
            try {
              await updateEntireBoard(boardData)
              displayContent = `✅ Updated the entire board! ${boardData.explanation || 'Board has been refreshed with new content.'}`
            } catch (boardError) {
              console.error('❌ Failed to update board:', boardError)
              displayContent = `❌ Failed to update board: ${boardError instanceof Error ? boardError.message : 'Unknown error'}`
            }
            
          } else if (boardData.action === 'create_shapes' && boardData.shapes) {
            // Legacy support for old format - just add shapes
            isJsonResponse = true
            try {
              await createBoardShape(boardData.shapes)
              displayContent = `✅ Created content on the board! ${boardData.explanation || 'Shapes have been added to your board.'}`
            } catch (boardError) {
              console.error('❌ Failed to create shapes:', boardError)
              displayContent = `❌ Failed to create shapes: ${boardError instanceof Error ? boardError.message : 'Unknown error'}`
            }
          }
        }
      } catch (jsonError) {
        console.log('Error parsing JSON board data:', jsonError)
        // This is normal for regular conversation responses
      }
      
      // Only add the message to chat if it's not a pure JSON response
      if (!isJsonResponse || displayContent !== aiResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: displayContent,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Save assistant message to database
        await saveChatMessage(assistantMessage)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response. Please check your API key configuration.'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Save error message to database
      await saveChatMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Circular toggle button
  const toggleButton = (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-105 text-white"
      title="Open Mentor AI Chat"
    >
      <span className="text-lg">🤖</span>
    </button>
  )

  // Expanded chat panel
  const expandedPanel = (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-[500px] h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-gray-800">Mentor AI</h3>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700 text-lg font-bold transition-colors"
        >
          ×
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveMode('chat')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeMode === 'chat'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveMode('script')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeMode === 'script'
              ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📝 Script Mode
        </button>
      </div>

            {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeMode === 'chat' ? (
          /* Chat Messages */
          <div className="p-4 space-y-3 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading chat history...</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <FormattedMessage content={message.content} />
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Script Mode */
          <div className="p-4 space-y-4 h-full">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-purple-800 mb-1">📝 Script Visualization</h4>
              <p className="text-xs text-purple-600">
                Provide a script/description and optional screenshots. AI will create a visual board layout based on your content.
              </p>
            </div>

            {/* Script Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script/Description
              </label>
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Enter your script, process description, or any content you want to visualize on the board..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                rows={6}
                disabled={isLoading}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screenshots (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  disabled={isLoading || uploadingImages}
                >
                  {uploadingImages ? '⏳ Uploading...' : '📸 Upload Screenshots'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Support: JPG, PNG, GIF, WEBP • Images saved to storage
                </p>
              </div>
            </div>

            {/* Uploaded Images */}
            {uploadedImageUrls.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded Images ({uploadedImageUrls.length}) • Ready for AI analysis
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {uploadedImageUrls.map((imageRecord, index) => (
                    <div key={imageRecord.id} className="relative group">
                      <img
                        src={imageRecord.storage_url}
                        alt={imageRecord.filename}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded">
                        <div className="absolute bottom-0 left-0 right-0 p-1">
                          <p className="text-xs text-white opacity-0 group-hover:opacity-100 truncate">
                            {imageRecord.filename}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={processScript}
              disabled={isLoading || !scriptContent.trim() || uploadingImages}
              className="w-full btn-black py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🔄 Generating Visualization...' : 
               uploadingImages ? '⏳ Uploading Images...' :
               `🎨 Generate Board Visualization${uploadedImageUrls.length > 0 ? ` (${uploadedImageUrls.length} images)` : ''}`}
            </button>
          </div>
        )}
      </div>

            {/* Input - Only show for chat mode */}
      {activeMode === 'chat' && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about mentoring or request board content..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="btn-black px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {isExpanded ? expandedPanel : toggleButton}
    </div>
  )
} 