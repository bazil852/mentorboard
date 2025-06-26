import React, { useState, useRef, useEffect } from 'react'
import { Editor, toRichText } from 'tldraw'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MentorChatPanelProps {
  editor: Editor | null
}

export const MentorChatPanel: React.FC<MentorChatPanelProps> = ({ editor }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeMode, setActiveMode] = useState<'chat' | 'script'>('chat')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Mentor AI assistant. I can help you with mentoring strategies, provide feedback, and even generate content directly on your board. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [scriptContent, setScriptContent] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      )
      setUploadedImages(prev => [...prev, ...imageFiles])
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
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

  const processScript = async () => {
    if (!scriptContent.trim() || isLoading) return

    setIsLoading(true)

    try {
      const boardContext = getBoardContext()
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
      }

      // Convert images to base64
      const imageBase64Array = await Promise.all(
        uploadedImages.map(async (file) => {
          const base64 = await convertImageToBase64(file)
          return {
            type: "image_url",
            image_url: {
              url: base64,
              detail: "high"
            }
          }
        })
      )

      const systemPrompt = `You are a Mentor AI assistant specialized in creating visual board layouts from scripts and screenshots. 

BOARD CONTEXT:
- Current board has ${boardContext?.shapeCount || 0} shapes
- Board types available: ${boardContext?.shapeTypes?.join(', ') || 'none'}

SCRIPT VISUALIZATION TASK:
You will receive a script/description and optional screenshots. Your job is to create a comprehensive visual board layout that represents the script content using various shapes and visual elements.

RESPONSE FORMAT - You MUST respond with JSON containing shapes to create:
\`\`\`json
{
  "action": "create_shapes",
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
  ],
  "explanation": "Brief explanation of the visualization created"
}
\`\`\`

VISUALIZATION GUIDELINES:
1. **Layout Structure**: Create a logical flow/hierarchy
2. **Use Different Shapes**:
   - Text shapes for titles, headers, labels
   - Note shapes for key points, action items
   - Rectangle/geo shapes for categories, sections, processes
   - Arrows to show relationships and flow
3. **Color Coding**: Use colors meaningfully (e.g., red for problems, green for solutions, blue for processes)
4. **Positioning**: Arrange shapes in a logical spatial layout
5. **Content Breakdown**: Break down the script into visual components

IMPORTANT: Always respond with the JSON format above to create the visual board representation.`

      const content = [
        { type: "text", text: `Script to visualize:\n\n${scriptContent}` },
        ...imageBase64Array
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

    try {
      const boardContext = getBoardContext()
      
      const systemPrompt = `You are a Mentor AI assistant helping with mentoring and coaching activities. You have access to a collaborative whiteboard (tldraw) where you can help users create content.

BOARD CONTEXT:
- Current board has ${boardContext?.shapeCount || 0} shapes
- Board types available: ${boardContext?.shapeTypes?.join(', ') || 'none'}

BOARD CREATION CAPABILITY:
When users ask you to create, add, generate, or draw content on the board, you MUST respond with a JSON object containing the shapes to create. Use this EXACT format:

**DETECTION KEYWORDS:** create, add, generate, draw, make, build, put on board, add to board, show on board

**RESPONSE FORMAT when creating board content:**
\`\`\`json
{
  "action": "create_shapes",
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
  ],
  "explanation": "Brief explanation of what was created"
}
\`\`\`

**AVAILABLE SHAPE TYPES:**
1. **text** - Simple text labels, titles, notes
2. **note** - Sticky notes (built-in tldraw note shapes)
3. **rectangle/geo** - Shapes with text inside (rectangles, circles, etc.)
4. **arrow** - Connecting arrows between elements

**SHAPE PROPERTIES:**
- type: "text" | "note" | "rectangle" | "geo" | "arrow"
- content: Text content to display (will be converted to richText automatically)
- color: "black" | "blue" | "red" | "yellow" | "green" | "orange" | "violet" | "light-blue" 
- size: "s" | "m" | "l" | "xl" (for text/notes)
- width/height: Dimensions for rectangles (default: 200x100)
- fill: "none" | "semi" | "solid" (for geo shapes)
- geo: "rectangle" | "ellipse" | "triangle" | "diamond" (for geo type)

**IMPORTANT:** All text content is automatically converted to richText format using toRichText()

**EXAMPLE REQUESTS & RESPONSES:**

User: "Create a SWOT analysis on the board"
Response:
\`\`\`json
{
  "action": "create_shapes",
  "shapes": [
    {"type": "text", "content": "SWOT Analysis", "x": 100, "y": 50, "size": "xl", "color": "black"},
    {"type": "rectangle", "content": "Strengths", "width": 200, "height": 150, "color": "green", "fill": "semi"},
    {"type": "rectangle", "content": "Weaknesses", "width": 200, "height": 150, "color": "red", "fill": "semi"},
    {"type": "rectangle", "content": "Opportunities", "width": 200, "height": 150, "color": "blue", "fill": "semi"},
    {"type": "rectangle", "content": "Threats", "width": 200, "height": 150, "color": "orange", "fill": "semi"}
  ],
  "explanation": "Created a SWOT analysis framework with four quadrants for strategic planning."
}
\`\`\`

User: "Add some action items as sticky notes"
Response:
\`\`\`json
{
  "action": "create_shapes", 
  "shapes": [
    {"type": "note", "content": "Follow up with team", "color": "yellow"},
    {"type": "note", "content": "Schedule next meeting", "color": "yellow"},
    {"type": "note", "content": "Review project timeline", "color": "orange"}
  ],
  "explanation": "Added three action item sticky notes to track next steps."
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
            ...messages.slice(-5).map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0]?.message?.content || 'Sorry, I encountered an error.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Check if the AI response contains JSON for board creation
      try {
        const responseText = assistantMessage.content
        
        // Look for JSON code blocks
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          const jsonString = jsonMatch[1]
          const boardData = JSON.parse(jsonString)
          
          if (boardData.action === 'create_shapes' && boardData.shapes) {
            // Create the shapes on the board
            await createBoardShape(boardData.shapes)
            
            // Add a confirmation message
            const confirmationMessage: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: `✅ Created content on the board! ${boardData.explanation || 'Shapes have been added to your board.'}`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, confirmationMessage])
          }
        }
      } catch (jsonError) {
        console.log('No valid JSON board creation data found in response')
        // This is normal for regular conversation responses
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm lg:max-w-lg px-3 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
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
                  disabled={isLoading}
                >
                  📸 Upload Screenshots
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Support: JPG, PNG, GIF, WEBP
                </p>
              </div>
            </div>

            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded Images ({uploadedImages.length})
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-16 object-cover rounded border"
                      />
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
              disabled={isLoading || !scriptContent.trim()}
              className="w-full btn-black py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🔄 Generating Visualization...' : '🎨 Generate Board Visualization'}
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
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isExpanded ? expandedPanel : toggleButton}
    </div>
  )
} 