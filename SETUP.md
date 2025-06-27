# The Mentor Board - Setup Guide

## 🚀 Quick Start

This guide will help you set up The Mentor Board with Supabase authentication and user dashboard functionality.

## 📋 Prerequisites

- Node.js (v18 or higher)
- A Supabase account ([sign up here](https://supabase.com))
- OpenAI API key (for AI features)

## 🛠️ Installation Steps

### 1. Clone and Install Dependencies

```bash
cd the-mentor-board
npm install
```

### 2. Set Up Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Wait for the project to be ready (2-3 minutes)
4. Go to **Settings** → **API** in your Supabase dashboard
5. Copy the **Project URL** and **anon public key**

### 3. Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp env.example .env
```

2. Update the `.env` file with your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-migration.sql`
3. Paste and run the SQL in the editor
4. This will create the necessary tables and security policies

### 5. Configure Authentication Providers (Optional)

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable additional providers if desired:
   - **Google**: Follow Supabase's Google OAuth guide
   - **GitHub**: Follow Supabase's GitHub OAuth guide
3. Update redirect URLs:
   - For development: `http://localhost:5173/dashboard`
   - For production: `https://yourdomain.com/dashboard`

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎯 Features Overview

### Authentication System
- ✅ Email/password authentication
- ✅ Magic link authentication
- ✅ Social login (Google, GitHub)
- ✅ Secure user sessions
- ✅ Automatic user profiles

### Dashboard Features
- ✅ View all user boards
- ✅ Create new boards
- ✅ Delete boards
- ✅ Board statistics
- ✅ Real-time updates

### Board Features
- ✅ Full tldraw integration
- ✅ Auto-save functionality
- ✅ Manual save option
- ✅ Collaboration mode
- ✅ AI Mentor Chat
- ✅ Template generation
- ✅ Board persistence

## 🔐 Security Features

- **Row Level Security (RLS)**: Users can only access their own boards
- **JWT Authentication**: Secure session management
- **API Key Protection**: Environment variables for sensitive data
- **CORS Protection**: Proper origin restrictions

## 📊 Database Schema

### Boards Table
```sql
- id (UUID, Primary Key)
- name (Text, Required)
- description (Text, Optional)
- board_data (JSONB, Board state)
- created_at (Timestamp)
- updated_at (Timestamp)
- user_id (UUID, Foreign Key)
- is_public (Boolean)
```

### Profiles Table
```sql
- id (UUID, Primary Key, links to auth.users)
- email (Text)
- full_name (Text)
- avatar_url (Text)
- created_at (Timestamp)
```

## 🚀 Deployment

### Environment Setup for Production

1. Update your `.env` for production:
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

2. Update Supabase authentication settings:
   - Add your production domain to allowed redirect URLs
   - Configure any social auth providers with production URLs

### Build for Production

```bash
npm run build
npm run preview
```

## 🔧 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env` file exists and has correct variable names
   - Variables must start with `VITE_` for Vite to include them

2. **Authentication not working**
   - Check Supabase project URL and anon key
   - Verify database migration was run successfully
   - Check browser console for errors

3. **Boards not saving**
   - Verify user is authenticated
   - Check Supabase RLS policies are correctly applied
   - Ensure `boards` table exists

4. **AI features not working**
   - Verify OpenAI API key is valid
   - Check API key has sufficient credits
   - Ensure key is properly set in environment variables

### Debug Mode

Add this to your browser console to check authentication state:
```javascript
// Check current user
console.log('Current user:', supabase.auth.getUser())

// Check boards data
console.log('Boards:', await supabase.from('boards').select('*'))
```

## 📝 Usage Guide

### Creating Your First Board

1. **Sign up/Login**: Use the authentication page
2. **Dashboard**: You'll see an empty dashboard
3. **Create Board**: Click "New Board" or "Create Your First Board"
4. **Name & Describe**: Enter board details
5. **Start Creating**: The board opens automatically

### Board Features

- **Auto-save**: Changes save automatically every 30 seconds
- **Manual Save**: Click the "Save" button for immediate save
- **Collaboration**: Toggle collaboration mode for real-time sharing
- **AI Chat**: Use the AI mentor for guidance and content generation
- **Templates**: Quick-start with 1-on-1, feedback, or planning templates

### Collaboration

1. **Enable Collaboration**: Click the "Solo/Collaborating" toggle
2. **Share Room ID**: Share the room ID with collaborators
3. **Real-time**: See live cursors and changes
4. **Copy URL**: Use the collaboration panel to copy share URLs

## 🤝 Support

For support and questions:
- Check the troubleshooting section above
- Review Supabase documentation for authentication issues
- Check tldraw documentation for canvas-related questions

## 🔄 Updates

To update the application:
```bash
git pull origin main
npm install
npm run dev
```

## 📄 License

This project is licensed under the MIT License. 