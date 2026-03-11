-- VaultX Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- CARDS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_holder_name TEXT NOT NULL,
  card_number_encrypted TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'other',
  bank_name TEXT DEFAULT '',
  notes_encrypted TEXT,
  color_scheme TEXT DEFAULT 'metallic-gray',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own cards"
  ON cards FOR ALL
  USING (auth.uid() = user_id);

-- ================================================
-- PASSWORDS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS passwords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_url TEXT,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  notes TEXT,
  icon_url TEXT,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE
);

-- RLS for passwords
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own passwords"
  ON passwords FOR ALL
  USING (auth.uid() = user_id);

-- ================================================
-- DOCUMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id);

-- ================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policy
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can download their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================
-- AUTO-UPDATE TRIGGER
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_passwords_updated_at
  BEFORE UPDATE ON passwords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
