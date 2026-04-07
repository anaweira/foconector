
-- Change score column from INT to JSONB to store detailed scoring
ALTER TABLE public.essays ALTER COLUMN score DROP DEFAULT;
ALTER TABLE public.essays ALTER COLUMN score TYPE JSONB USING CASE WHEN score IS NOT NULL THEN to_jsonb(score) ELSE NULL END;
