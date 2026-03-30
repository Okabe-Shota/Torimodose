-- Enable RLS on salary_statistics table if not already enabled
ALTER TABLE public.salary_statistics ENABLE ROW LEVEL SECURITY;

-- Allow all users (authenticated and anonymous) to read salary statistics (reference data)
CREATE POLICY "allow_read_salary_statistics" ON public.salary_statistics
  FOR SELECT
  USING (true);
