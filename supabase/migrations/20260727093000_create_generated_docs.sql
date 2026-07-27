-- Create generated_docs table
CREATE TABLE IF NOT EXISTS public.generated_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id UUID NOT NULL REFERENCES public.api_specs(id) ON DELETE CASCADE,
  overview TEXT,
  auth_guide TEXT,
  quick_start TEXT,
  best_practices TEXT,
  full_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on generated_docs
ALTER TABLE public.generated_docs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for generated_docs
CREATE POLICY "Users can view generated docs for their own specs"
  ON public.generated_docs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert generated docs for their own specs"
  ON public.generated_docs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update generated docs for their own specs"
  ON public.generated_docs FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_generated_docs_spec_id ON public.generated_docs(spec_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.generated_docs TO authenticated;
GRANT ALL ON public.generated_docs TO service_role;
