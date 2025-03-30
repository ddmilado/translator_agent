-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'Documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Set up storage policy to allow users to read their own files
CREATE POLICY "Allow users to read their own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_file_id TEXT NOT NULL,
  translated_file_path TEXT,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  topic TEXT DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS policies for translations table
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own translations
CREATE POLICY "Allow users to select their own translations"
  ON public.translations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own translations
CREATE POLICY "Allow users to insert their own translations"
  ON public.translations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own translations
CREATE POLICY "Allow users to update their own translations"
  ON public.translations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_translations_updated_at
    BEFORE UPDATE ON public.translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();