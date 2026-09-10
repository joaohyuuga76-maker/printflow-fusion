-- =============================================================================
-- PDV / Operadores internos: login por tabela `operadores` (sem supabase.auth)
-- e workspace único compartilhado por todos os operadores da loja.
-- Workspace ID = 00000000-0000-0000-0000-000000000001
-- =============================================================================

-- 1) Tabela de operadores -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operadores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  usuario    text NOT NULL UNIQUE,
  pin        text NOT NULL,
  cargo      text NOT NULL DEFAULT 'operador',
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operadores TO anon, authenticated;

ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "operadores_acesso" ON public.operadores;
CREATE POLICY "operadores_acesso" ON public.operadores
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS operadores_updated ON public.operadores;
CREATE TRIGGER operadores_updated BEFORE UPDATE ON public.operadores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Operador padrão inicial: usuario "flow" / PIN "9999" (admin)
INSERT INTO public.operadores (nome, usuario, pin, cargo, ativo)
VALUES ('Flow Admin', 'flow', '9999', 'admin', true)
ON CONFLICT (usuario) DO NOTHING;

-- 2) Abrir as tabelas do ERP para o workspace compartilhado (papel anon) ------
DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'settings','printers','filaments','clients','orders','products',
    'failures','extra_costs','finance_entries','cash_sessions','sales',
    'sale_items','nfe_imports','nfe_import_items'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    -- remove FK para auth.users (o workspace id não existe em auth.users)
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I;', t, t || '_user_id_fkey');
    -- concede acesso ao papel anônimo
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated;', t);
    -- default do user_id passa a ser o workspace
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT %L;', t, '00000000-0000-0000-0000-000000000001');
    -- garante RLS habilitado
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    -- política única compartilhada
    EXECUTE format('DROP POLICY IF EXISTS "%s_workspace" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "%s_workspace" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;

-- Remove as políticas antigas baseadas em auth.uid()
DROP POLICY IF EXISTS "own settings"        ON public.settings;
DROP POLICY IF EXISTS "own printers"        ON public.printers;
DROP POLICY IF EXISTS "own filaments"       ON public.filaments;
DROP POLICY IF EXISTS "own clients"         ON public.clients;
DROP POLICY IF EXISTS "own orders"          ON public.orders;
DROP POLICY IF EXISTS "own products"        ON public.products;
DROP POLICY IF EXISTS "own failures"        ON public.failures;
DROP POLICY IF EXISTS "own extras"          ON public.extra_costs;
DROP POLICY IF EXISTS "own finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "own cash sessions"   ON public.cash_sessions;
DROP POLICY IF EXISTS "own sales"           ON public.sales;
DROP POLICY IF EXISTS "own sale items"      ON public.sale_items;
DROP POLICY IF EXISTS "own nfe imports"     ON public.nfe_imports;
DROP POLICY IF EXISTS "own nfe items"       ON public.nfe_import_items;

-- 3) Migrar os dados existentes para o workspace compartilhado ----------------
-- settings tem PK em user_id: mantém apenas 1 linha antes de migrar
DELETE FROM public.settings
  WHERE user_id NOT IN (SELECT user_id FROM public.settings ORDER BY updated_at DESC LIMIT 1);

UPDATE public.settings         SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.printers         SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.filaments        SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.clients          SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.orders           SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.products         SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.failures         SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.extra_costs      SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.finance_entries  SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.cash_sessions    SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.sales            SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.sale_items       SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.nfe_imports      SET user_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.nfe_import_items SET user_id = '00000000-0000-0000-0000-000000000001';

-- 4) Storage das notas fiscais (bucket notas-fiscais) -------------------------
DROP POLICY IF EXISTS "own invoice files select" ON storage.objects;
DROP POLICY IF EXISTS "own invoice files insert" ON storage.objects;
DROP POLICY IF EXISTS "own invoice files update" ON storage.objects;
DROP POLICY IF EXISTS "own invoice files delete" ON storage.objects;
DROP POLICY IF EXISTS "notas_fiscais_workspace" ON storage.objects;
CREATE POLICY "notas_fiscais_workspace" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id = 'notas-fiscais' AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001')
  WITH CHECK (bucket_id = 'notas-fiscais' AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001');
