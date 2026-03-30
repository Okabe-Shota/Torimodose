-- Create diagnosis_inputs table to store user input data
CREATE TABLE IF NOT EXISTS public.diagnosis_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  income INTEGER NOT NULL,
  age INTEGER NOT NULL,
  occupation TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_diagnosis_inputs_diagnosis_id ON public.diagnosis_inputs(diagnosis_id);

-- Enable RLS
ALTER TABLE public.diagnosis_inputs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert
CREATE POLICY "allow_anonymous_insert_inputs" ON public.diagnosis_inputs
  FOR INSERT WITH CHECK (true);

-- Allow anonymous read
CREATE POLICY "allow_anonymous_read_inputs" ON public.diagnosis_inputs
  FOR SELECT USING (true);
