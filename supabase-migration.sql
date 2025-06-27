-- Migration for The Mentor Board
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security (RLS)
-- This ensures users can only access their own data

-- Create boards table
CREATE TABLE public.boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    board_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL
);

-- Create profiles table (optional - for extended user info)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for boards table
-- Users can only see their own boards
CREATE POLICY "Users can view own boards" ON public.boards
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own boards
CREATE POLICY "Users can insert own boards" ON public.boards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own boards
CREATE POLICY "Users can update own boards" ON public.boards
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own boards
CREATE POLICY "Users can delete own boards" ON public.boards
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on boards
CREATE TRIGGER handle_boards_updated_at
    BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_boards_user_id ON public.boards(user_id);
CREATE INDEX idx_boards_updated_at ON public.boards(updated_at);
CREATE INDEX idx_boards_is_public ON public.boards(is_public);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create templates table
CREATE TABLE public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom',
    template_data JSONB NOT NULL,
    preview_image TEXT,
    is_public BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    usage_count INTEGER DEFAULT 0
);

-- Create template_usage table to track template usage
CREATE TABLE public.template_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for templates
CREATE POLICY "Users can view templates" ON public.templates
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for template_usage
CREATE POLICY "Users can view their own template usage" ON public.template_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create template usage records" ON public.template_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.templates
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_is_public ON public.templates(is_public);
CREATE INDEX idx_templates_usage_count ON public.templates(usage_count DESC);
CREATE INDEX idx_template_usage_template_id ON public.template_usage(template_id);
CREATE INDEX idx_template_usage_user_id ON public.template_usage(user_id);

-- Create board_chats table to store chat conversations
CREATE TABLE public.board_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_sessions table to group related messages
CREATE TABLE public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for chat tables
ALTER TABLE public.board_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_chats
CREATE POLICY "Users can view their own board chats" ON public.board_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own board chats" ON public.board_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own board chats" ON public.board_chats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own board chats" ON public.board_chats
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" ON public.chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for chat tables
CREATE INDEX idx_board_chats_board_id ON public.board_chats(board_id);
CREATE INDEX idx_board_chats_user_id ON public.board_chats(user_id);
CREATE INDEX idx_board_chats_created_at ON public.board_chats(created_at);
CREATE INDEX idx_chat_sessions_board_id ON public.chat_sessions(board_id);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_is_active ON public.chat_sessions(is_active);

-- Add triggers for updated_at on chat tables
CREATE TRIGGER handle_board_chats_updated_at
    BEFORE UPDATE ON public.board_chats
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create board_images table to store uploaded images
CREATE TABLE public.board_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for board_images
ALTER TABLE public.board_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_images
CREATE POLICY "Users can view their own board images" ON public.board_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own board images" ON public.board_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own board images" ON public.board_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own board images" ON public.board_images
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for board_images
CREATE INDEX idx_board_images_board_id ON public.board_images(board_id);
CREATE INDEX idx_board_images_user_id ON public.board_images(user_id);
CREATE INDEX idx_board_images_created_at ON public.board_images(created_at);

-- Add trigger for updated_at on board_images
CREATE TRIGGER handle_board_images_updated_at
    BEFORE UPDATE ON public.board_images
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 