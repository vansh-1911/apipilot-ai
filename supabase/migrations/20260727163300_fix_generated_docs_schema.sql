-- ============================================================
-- Migration: Align generated_docs table with ai-document-generator.ts
-- ============================================================
-- The initial migration (054444) created generated_docs with columns:
--   overview, authentication, endpoints (jsonb), markdown, generated_at
--
-- The code expects:
--   overview, auth_guide, quick_start, best_practices, full_markdown, created_at, updated_at
--
-- This migration transforms the existing table to match.
-- ============================================================

-- 1. Add the new columns that are missing
ALTER TABLE public.generated_docs
  ADD COLUMN IF NOT EXISTS auth_guide TEXT,
  ADD COLUMN IF NOT EXISTS quick_start TEXT,
  ADD COLUMN IF NOT EXISTS best_practices TEXT,
  ADD COLUMN IF NOT EXISTS full_markdown TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Migrate any existing data from old columns to new ones
--    (authentication -> auth_guide, markdown -> full_markdown)
UPDATE public.generated_docs
SET
  auth_guide = COALESCE(auth_guide, authentication),
  full_markdown = COALESCE(full_markdown, markdown)
WHERE authentication IS NOT NULL OR markdown IS NOT NULL;

-- 3. Drop the old columns that the code no longer uses
ALTER TABLE public.generated_docs
  DROP COLUMN IF EXISTS authentication,
  DROP COLUMN IF EXISTS endpoints,
  DROP COLUMN IF EXISTS markdown,
  DROP COLUMN IF EXISTS generated_at;

-- 4. Add updated_at trigger (matches the pattern used on api_specs)
CREATE TRIGGER update_generated_docs_updated_at
  BEFORE UPDATE ON public.generated_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
