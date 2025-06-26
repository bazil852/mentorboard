# 🎯 The Mentor Board

A collaborative mentoring whiteboard built with [tldraw](https://tldraw.dev) - The ultimate Miro clone designed specifically for mentors and mentees.

![The Mentor Board](https://img.shields.io/badge/Built%20with-tldraw-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.15-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎨 **Full Canvas Experience**
- **Drawing Tools**: Pen, shapes, text, arrows, and more
- **Real-time Collaboration**: Multiple users working simultaneously  
- **Live Cursors**: See where other collaborators are working
- **Infinite Canvas**: Unlimited space for your ideas

### 🤝 **Collaboration Features**
- **Real-time Sync**: Changes appear instantly for all users
- **Room-based Sessions**: Private collaboration rooms
- **Share URLs**: Easy invitation system
- **Cursor Chat**: Communicate without leaving the canvas

### 📋 **Mentor-Specific Templates**
- **1-on-1 Meetings**: Structured templates for regular check-ins
- **Feedback Sessions**: Visual feedback collection boards  
- **Planning Boards**: Quarterly and goal planning layouts
- **Custom Templates**: Create your own reusable templates

### 💾 **Export & Persistence**
- **Local Storage**: Automatic save to browser storage
- **Export Options**: PNG, SVG, and JSON formats
- **High Quality**: 2x resolution exports for crisp images

### 🎛️ **Board Management**
- **Zoom Controls**: Fit to content, custom zoom levels
- **Clear Board**: Quick reset functionality
- **Settings Panel**: Comprehensive configuration options

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd the-mentor-board
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

## 🏗️ Tech Stack

- **[tldraw](https://tldraw.dev)** - Infinite canvas and drawing engine
- **[@tldraw/sync](https://tldraw.dev/docs/collaboration)** - Real-time collaboration
- **React 18** - UI framework
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Styling and responsive design
- **Vite** - Fast build tool and development server

## 🎮 Usage

### Starting a Session
1. Open The Mentor Board
2. Begin drawing immediately on the local canvas
3. Use templates from the toolbar for structured sessions

### Collaboration
1. Click **"Start Collaboration"** in the toolbar
2. Share the generated room URL with participants
3. All changes sync in real-time across devices

### Templates
- **📅 1-on-1**: Perfect for regular mentor-mentee meetings
- **💬 Feedback**: Structured feedback collection
- **📋 Planning**: Goal setting and quarterly planning

### Export Options
1. Click the settings (⚙️) button
2. Choose your preferred format:
   - **PNG**: High-quality raster image
   - **SVG**: Scalable vector graphics
   - **JSON**: Raw board data for backup/restore

## 🛠️ Development

### Project Structure
```
the-mentor-board/
├── src/
│   ├── components/           # React components
│   │   ├── MentorToolbar.tsx    # Main toolbar
│   │   ├── CollaborationPanel.tsx # Collaboration controls
│   │   └── BoardSettings.tsx     # Settings modal
│   ├── App.tsx              # Main application
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── tailwind.config.js       # Tailwind configuration
└── package.json             # Dependencies and scripts
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Customization
The application is built with modularity in mind. Key customization points:

- **Templates**: Add new templates in `App.tsx` > `addMentorTemplate`
- **Styling**: Modify Tailwind classes or add custom CSS
- **Features**: Extend components or add new panels

## 🎯 Use Cases

### For Mentors
- **Visual Feedback**: Draw diagrams and provide visual feedback
- **Session Planning**: Use templates to structure mentoring sessions
- **Progress Tracking**: Create visual progress boards
- **Collaborative Problem Solving**: Work through challenges together

### For Mentees
- **Note Taking**: Visual note-taking during sessions
- **Goal Visualization**: Create and track goal progression
- **Portfolio Review**: Collaborate on project presentations
- **Learning Maps**: Build knowledge and skill maps

### For Teams
- **Retrospectives**: Visual team retrospectives  
- **Brainstorming**: Collaborative ideation sessions
- **Planning**: Sprint planning and roadmap creation
- **Knowledge Sharing**: Create shared knowledge boards

## 🔒 Privacy & Security

- **Local-First**: Data stored locally by default
- **Temporary Rooms**: Collaboration rooms are temporary and auto-expire
- **No Registration**: No account creation required
- **Private Sessions**: Room IDs are long and hard to guess

## 📖 API Reference

### tldraw Integration
Built on the robust tldraw engine with full access to:
- **Editor API**: Programmatic canvas control
- **Shape Creation**: Dynamic shape and content generation  
- **Event Handling**: Custom interactions and behaviors
- **Store Management**: Data persistence and synchronization

## 🤝 Contributing

We welcome contributions! Areas for improvement:
- Additional mentor-specific templates
- Enhanced export options
- Mobile experience improvements
- Accessibility enhancements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **[tldraw](https://tldraw.dev)** - For the amazing infinite canvas library
- **[Tailwind CSS](https://tailwindcss.com)** - For the utility-first CSS framework
- **[React](https://react.dev)** - For the component-based architecture

---

**Built with ❤️ for the mentoring community**

*Start mentoring visually with The Mentor Board! 🎯*
# mentorboard
