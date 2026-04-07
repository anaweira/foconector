
ALTER TABLE public.note_highlights ADD COLUMN IF NOT EXISTS annotation text;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS alternatives jsonb;
ALTER TABLE public.essays ADD COLUMN IF NOT EXISTS collection_text text;
