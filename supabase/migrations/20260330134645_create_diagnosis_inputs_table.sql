-- Create diagnosis_inputs table to store user input data (income, age, occupation, region)
CREATE TABLE public.diagnosis_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  income INTEGER NOT NULL,
  age INTEGER NOT NULL,
  occupation TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries by diagnosis_id
CREATE INDEX idx_diagnosis_inputs_diagnosis_id ON public.diagnosis_inputs(diagnosis_id);

-- Enable RLS on diagnosis_inputs table
ALTER TABLE public.diagnosis_inputs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert diagnosis_inputs
CREATE POLICY "allow_anonymous_insert_inputs" ON public.diagnosis_inputs
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous users to read diagnosis_inputs
CREATE POLICY "allow_anonymous_read_inputs" ON public.diagnosis_inputs
  FOR SELECT
  USING (true);

-- Allow authenticated users to read their own diagnosis inputs (via diagnosis.user_id)
CREATE POLICY "allow_user_select_inputs" ON public.diagnosis_inputs
  FOR SELECT
  USING (
    diagnosis_id IN (
      SELECT id FROM public.diagnoses
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );
