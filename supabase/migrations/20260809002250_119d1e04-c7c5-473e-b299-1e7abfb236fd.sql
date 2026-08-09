
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TABLE public.settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL DEFAULT 'Minha Farm 3D',
  cnpj text NOT NULL DEFAULT '',
  energy_rate numeric NOT NULL DEFAULT 0.92,
  default_margin numeric NOT NULL DEFAULT 120,
  failure_rate numeric NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.printers TO authenticated;
GRANT ALL ON public.printers TO service_role;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own printers" ON public.printers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER printers_updated BEFORE UPDATE ON public.printers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.filaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text NOT NULL,
  type text NOT NULL DEFAULT 'PLA',
  color text NOT NULL DEFAULT '',
  hex text NOT NULL DEFAULT '#94a3b8',
  total_g numeric NOT NULL DEFAULT 1000,
  remaining_g numeric NOT NULL DEFAULT 1000,
  price_per_kg numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.filaments TO authenticated;
GRANT ALL ON public.filaments TO service_role;
ALTER TABLE public.filaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own filaments" ON public.filaments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER filaments_updated BEFORE UPDATE ON public.filaments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders" ON public.orders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  weight_g numeric NOT NULL DEFAULT 0,
  hours numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  sold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  printer_id uuid REFERENCES public.printers(id) ON DELETE SET NULL,
  filament_id uuid REFERENCES public.filaments(id) ON DELETE SET NULL,
  lost_g numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.failures TO authenticated;
GRANT ALL ON public.failures TO service_role;
ALTER TABLE public.failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own failures" ON public.failures FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.extra_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extra_costs TO authenticated;
GRANT ALL ON public.extra_costs TO service_role;
ALTER TABLE public.extra_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own extras" ON public.extra_costs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
