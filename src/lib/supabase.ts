import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Board {
  id: string
  name: string
  description?: string
  board_data: any
  created_at: string
  updated_at: string
  user_id: string
  is_public: boolean
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  description?: string
  category: string
  template_data: any
  preview_image?: string
  is_public: boolean
  created_at: string
  updated_at: string
  user_id: string
  usage_count: number
}

export interface TemplateUsage {
  id: string
  template_id: string
  user_id: string
  board_id?: string
  used_at: string
}

export interface BoardChat {
  id: string
  board_id: string
  user_id: string
  message_type: 'user' | 'assistant'
  content: string
  metadata: any
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  board_id: string
  user_id: string
  title?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BoardImage {
  id: string
  board_id: string
  user_id: string
  filename: string
  storage_path: string
  storage_url: string
  content_type: string
  file_size: number
  width?: number
  height?: number
  metadata: any
  created_at: string
  updated_at: string
}