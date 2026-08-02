-- Add Unified API Model fields to api_specs
ALTER TABLE public.api_specs 
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS framework TEXT,
ADD COLUMN IF NOT EXISTS repo_url TEXT,
ADD COLUMN IF NOT EXISTS last_commit TEXT,
ADD COLUMN IF NOT EXISTS file_tree JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS health_report JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS env_vars JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS readme_content TEXT;

-- Update api_endpoints to support provenance
ALTER TABLE public.api_endpoints
ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{"source": "unknown", "confidence": "verified"}'::jsonb;

-- Create api_models table for Unified Model
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

-- Add RLS policies for api_models
CREATE POLICY "Users can view models for their own specs"
  ON public.api_models FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = api_models.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert models for their own specs"
  ON public.api_models FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = api_models.spec_id AND s.user_id = auth.uid()
  ));

-- Add index
CREATE INDEX IF NOT EXISTS idx_api_models_spec_id ON public.api_models(spec_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.api_models TO authenticated;
GRANT ALL ON public.api_models TO service_role;
