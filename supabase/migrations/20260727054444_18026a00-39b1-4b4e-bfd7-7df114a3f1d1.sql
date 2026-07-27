-- Status enum for api_specs
CREATE TYPE public.spec_status AS ENUM ('uploaded', 'processing', 'completed', 'failed');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============== profiles ===============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== api_specs ===============
CREATE TABLE public.api_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status public.spec_status NOT NULL DEFAULT 'uploaded',
  endpoint_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_specs TO authenticated;
GRANT ALL ON public.api_specs TO service_role;

ALTER TABLE public.api_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own specs"
  ON public.api_specs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own specs"
  ON public.api_specs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own specs"
  ON public.api_specs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own specs"
  ON public.api_specs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_api_specs_updated_at
  BEFORE UPDATE ON public.api_specs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_api_specs_user_id ON public.api_specs(user_id);

-- =============== generated_docs ===============
CREATE TABLE public.generated_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id UUID NOT NULL REFERENCES public.api_specs(id) ON DELETE CASCADE,
  overview TEXT,
  authentication TEXT,
  endpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  markdown TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_docs TO authenticated;
GRANT ALL ON public.generated_docs TO service_role;

ALTER TABLE public.generated_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view docs for their own specs"
  ON public.generated_docs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert docs for their own specs"
  ON public.generated_docs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update docs for their own specs"
  ON public.generated_docs FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete docs for their own specs"
  ON public.generated_docs FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.api_specs s
    WHERE s.id = generated_docs.spec_id AND s.user_id = auth.uid()
  ));

CREATE INDEX idx_generated_docs_spec_id ON public.generated_docs(spec_id);

-- =============== Storage policies for api-specifications bucket ===============
-- Files are stored under `<user_id>/...` so ownership is derived from the path prefix.
CREATE POLICY "Users can view their own spec files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'api-specifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own spec files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'api-specifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own spec files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'api-specifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own spec files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'api-specifications' AND auth.uid()::text = (storage.foldername(name))[1]);