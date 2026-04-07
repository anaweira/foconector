
-- Add status column to study_notes
ALTER TABLE public.study_notes ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- Add edital_url column to exams
ALTER TABLE public.exams ADD COLUMN edital_url TEXT;

-- Create editals storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('editals', 'editals', false);
CREATE POLICY "Users can upload editals" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'editals' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own editals" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'editals' AND (storage.foldername(name))[1] = auth.uid()::text);
