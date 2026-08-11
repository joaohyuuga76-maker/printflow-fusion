CREATE TABLE public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'receivable',
  description text NOT NULL,
  party text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'pendente',
  category text NOT NULL DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.finance_entries TO service_role;

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own finance entries" ON public.finance_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER finance_entries_updated
  BEFORE UPDATE ON public.finance_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();