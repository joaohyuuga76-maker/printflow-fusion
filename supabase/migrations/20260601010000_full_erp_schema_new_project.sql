-- =============================================================================
-- Schema COMPLETO do PrintFlow ERP para o projeto Supabase novo
-- (stjbixmtazojeufvfrar). Modelo PDV: sem auth.users, workspace único
-- compartilhado, acesso pelo papel anon (chave publishable no browser).
-- Rode UMA vez no SQL Editor do Supabase. É idempotente (IF NOT EXISTS).
-- Workspace ID = 00000000-0000-0000-0000-000000000001
-- =============================================================================

-- Função utilitária de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- Operadores (garante acesso/normaliza cargo caso já exista) ------------------
CREATE TABLE IF NOT EXISTS public.operadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  usuario text NOT NULL UNIQUE,
  pin text NOT NULL,
  cargo text NOT NULL DEFAULT 'operador',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operadores TO anon, authenticated;
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "operadores_acesso" ON public.operadores;
CREATE POLICY "operadores_acesso" ON public.operadores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
UPDATE public.operadores SET cargo = lower(cargo) WHERE cargo <> lower(cargo);
INSERT INTO public.operadores (nome, usuario, pin, cargo, ativo)
VALUES ('Flow Admin', 'flow', '9999', 'admin', true) ON CONFLICT (usuario) DO NOTHING;

-- Tabelas do ERP -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  user_id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  company text NOT NULL DEFAULT 'Minha Farm 3D',
  cnpj text NOT NULL DEFAULT '',
  energy_rate numeric NOT NULL DEFAULT 0.92,
  default_margin numeric NOT NULL DEFAULT 120,
  failure_rate numeric NOT NULL DEFAULT 5,
  phone text NOT NULL DEFAULT '',
  pix_key text NOT NULL DEFAULT '',
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name text NOT NULL,
  model text NOT NULL DEFAULT '',
  watts numeric NOT NULL DEFAULT 300,
  depreciation_per_hour numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'disponivel',
  current_file text,
  progress numeric,
  remaining_min numeric,
  hours_run numeric NOT NULL DEFAULT 0,
  failures integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.filaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  brand text NOT NULL,
  type text NOT NULL DEFAULT 'PLA',
  color text NOT NULL DEFAULT '',
  hex text NOT NULL DEFAULT '#94a3b8',
  total_g numeric NOT NULL DEFAULT 1000,
  remaining_g numeric NOT NULL DEFAULT 1000,
  price_per_kg numeric NOT NULL DEFAULT 100,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ref text NOT NULL,
  client text NOT NULL DEFAULT '',
  title text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'orcamento',
  date text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'media',
  weight_g numeric NOT NULL DEFAULT 0,
  hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  weight_g numeric NOT NULL DEFAULT 0,
  hours numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  sold integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  printer_id uuid REFERENCES public.printers(id) ON DELETE SET NULL,
  filament_id uuid REFERENCES public.filaments(id) ON DELETE SET NULL,
  lost_g numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.extra_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  kind text NOT NULL DEFAULT 'receivable',
  description text NOT NULL,
  party text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'pendente',
  category text NOT NULL DEFAULT '',
  paid_at timestamptz,
  invoice_number text NOT NULL DEFAULT '',
  invoice_series text NOT NULL DEFAULT '',
  invoice_path text,
  invoice_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  status text NOT NULL DEFAULT 'aberto',
  notes text NOT NULL DEFAULT '',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  cash_session_id uuid REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  client text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT 'dinheiro',
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nfe_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  access_key text NOT NULL DEFAULT '',
  supplier text NOT NULL DEFAULT '',
  issue_date date,
  total numeric NOT NULL DEFAULT 0,
  file_name text,
  status text NOT NULL DEFAULT 'confirmada',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nfe_import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  import_id uuid NOT NULL REFERENCES public.nfe_imports(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  target_type text NOT NULL DEFAULT 'nenhum',
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Grants + RLS (workspace compartilhado / anon) + triggers -------------------
DO $$
DECLARE
  t text;
  com_updated text[] := ARRAY['settings','printers','filaments','clients','orders','products','finance_entries','cash_sessions'];
  todas text[] := ARRAY[
    'settings','printers','filaments','clients','orders','products',
    'failures','extra_costs','finance_entries','cash_sessions','sales',
    'sale_items','nfe_imports','nfe_import_items'
  ];
BEGIN
  FOREACH t IN ARRAY todas LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_workspace" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "%s_workspace" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
  END LOOP;
  FOREACH t IN ARRAY com_updated LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', t || '_updated', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t || '_updated', t);
  END LOOP;
END $$;

-- Linha inicial de configurações da loja
INSERT INTO public.settings (user_id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

-- Storage das notas fiscais --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais', 'notas-fiscais', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "notas_fiscais_workspace" ON storage.objects;
CREATE POLICY "notas_fiscais_workspace" ON storage.objects FOR ALL TO anon, authenticated
  USING (bucket_id = 'notas-fiscais' AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001')
  WITH CHECK (bucket_id = 'notas-fiscais' AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001');
