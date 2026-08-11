ALTER TABLE public.finance_entries
  ADD COLUMN IF NOT EXISTS invoice_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_series text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_path text,
  ADD COLUMN IF NOT EXISTS invoice_name text;