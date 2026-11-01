-- Pricing controls used by the commercial quote calculator.
-- Additive and safe to re-run. Apply after the ERP settings table exists.
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS minimum_margin numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS batch_discounts jsonb NOT NULL DEFAULT
    '[{"minQuantity":1,"discountPercent":0},{"minQuantity":3,"discountPercent":10},{"minQuantity":5,"discountPercent":16.7},{"minQuantity":10,"discountPercent":23.3},{"minQuantity":20,"discountPercent":30}]'::jsonb;

ALTER TABLE public.settings
  DROP CONSTRAINT IF EXISTS settings_minimum_margin_range,
  ADD CONSTRAINT settings_minimum_margin_range
    CHECK (minimum_margin >= 0 AND minimum_margin < 100),
  DROP CONSTRAINT IF EXISTS settings_batch_discounts_array,
  ADD CONSTRAINT settings_batch_discounts_array
    CHECK (jsonb_typeof(batch_discounts) = 'array');
