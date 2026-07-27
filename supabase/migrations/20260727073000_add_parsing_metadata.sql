-- Add new metadata fields to api_specs
ALTER TABLE public.api_specs 
ADD COLUMN IF NOT EXISTS api_version TEXT,
ADD COLUMN IF NOT EXISTS openapi_version TEXT,
ADD COLUMN IF NOT EXISTS auth_type TEXT,
ADD COLUMN IF NOT EXISTS servers JSONB DEFAULT '[]'::jsonb;

-- Create api_endpoints table
CREATE TABLE IF NOT EXISTS public.api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id UUID NOT NULL REFERENCES public.api_specs(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  operation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on api_endpoints
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for api_endpoints
CREATE POLICY "Users can view endpoints for their own specs"
  ON public.api_endpoints FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = api_endpoints.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert endpoints for their own specs"
  ON public.api_endpoints FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = api_endpoints.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete endpoints for their own specs"
  ON public.api_endpoints FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = api_endpoints.spec_id AND s.user_id = auth.uid()
  ));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_spec_id ON public.api_endpoints(spec_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.api_endpoints TO authenticated;
GRANT ALL ON public.api_endpoints TO service_role;
