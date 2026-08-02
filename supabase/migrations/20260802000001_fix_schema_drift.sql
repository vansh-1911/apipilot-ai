-- Consolidated Migration: Fix Schema Drift and Missing Columns
-- This migration ensures all columns expected by the frontend and services exist in the database.

-- 1. Fix api_specs table
ALTER TABLE public.api_specs 
ADD COLUMN IF NOT EXISTS api_version TEXT,
ADD COLUMN IF NOT EXISTS openapi_version TEXT,
ADD COLUMN IF NOT EXISTS auth_type TEXT,
ADD COLUMN IF NOT EXISTS servers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'openapi',
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS framework TEXT,
ADD COLUMN IF NOT EXISTS repo_url TEXT,
ADD COLUMN IF NOT EXISTS last_commit TEXT,
ADD COLUMN IF NOT EXISTS file_tree JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS health_report JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS env_vars JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS readme_content TEXT;

-- 2. Fix api_endpoints table
ALTER TABLE public.api_endpoints
ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{"source": "unknown", "confidence": "verified"}'::jsonb;

-- 3. Fix generated_docs table
-- Add the new columns that are missing
ALTER TABLE public.generated_docs
  ADD COLUMN IF NOT EXISTS auth_guide TEXT,
  ADD COLUMN IF NOT EXISTS quick_start TEXT,
  ADD COLUMN IF NOT EXISTS best_practices TEXT,
  ADD COLUMN IF NOT EXISTS full_markdown TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Migrate any existing data from old columns to new ones
-- (authentication -> auth_guide, markdown -> full_markdown)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_docs' AND column_name='authentication') THEN
        UPDATE public.generated_docs
        SET auth_guide = COALESCE(auth_guide, authentication)
        WHERE authentication IS NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_docs' AND column_name='markdown') THEN
        UPDATE public.generated_docs
        SET full_markdown = COALESCE(full_markdown, markdown)
        WHERE markdown IS NOT NULL;
    END IF;
END $$;

-- Drop legacy columns if they exist
ALTER TABLE public.generated_docs 
DROP COLUMN IF EXISTS authentication,
DROP COLUMN IF EXISTS endpoints,
DROP COLUMN IF EXISTS markdown,
DROP COLUMN IF EXISTS generated_at;

-- 4. Ensure api_models table exists
CREATE TABLE IF NOT EXISTS public.api_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id UUID NOT NULL REFERENCES public.api_specs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  provenance JSONB NOT NULL DEFAULT '{"source": "unknown", "confidence": "verified"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on api_models
ALTER TABLE public.api_models ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for api_models (using DO block to avoid error if policy exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view models for their own specs') THEN
        CREATE POLICY "Users can view models for their own specs"
          ON public.api_models FOR SELECT TO authenticated
          USING (EXISTS (
            SELECT 1 FROM public.api_specs s
            WHERE s.id = api_models.spec_id AND s.user_id = auth.uid()
          ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert models for their own specs') THEN
        CREATE POLICY "Users can insert models for their own specs"
          ON public.api_models FOR INSERT TO authenticated
          WITH CHECK (EXISTS (
            SELECT 1 FROM public.api_specs s
            WHERE s.id = api_models.spec_id AND s.user_id = auth.uid()
          ));
    END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_api_models_spec_id ON public.api_models(spec_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.api_models TO authenticated;
GRANT ALL ON public.api_models TO service_role;
