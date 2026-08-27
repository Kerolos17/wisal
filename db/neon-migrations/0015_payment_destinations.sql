-- Customer-visible receiving accounts for manual transfer. Values are managed
-- only by full platform administrators and are never exposed via public config.

CREATE TABLE IF NOT EXISTS public.payment_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL UNIQUE CHECK (method IN ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer')),
  label_ar text NOT NULL,
  label_en text NOT NULL,
  recipient_name text NOT NULL,
  account_identifier text NOT NULL,
  bank_name text NOT NULL DEFAULT '',
  instructions_ar text NOT NULL DEFAULT '',
  instructions_en text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_destinations_active_position_idx
  ON public.payment_destinations (active, position);

-- Extend the original Phase 1 constraint without changing existing records.
ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_payment_method_check;
ALTER TABLE public.payment_requests
  ADD CONSTRAINT payment_requests_payment_method_check
  CHECK (payment_method IN ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'));
