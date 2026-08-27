ALTER TABLE public.payment_destinations
  ADD COLUMN IF NOT EXISTS payment_url text NOT NULL DEFAULT '';

ALTER TABLE public.payment_destinations
  ADD COLUMN IF NOT EXISTS qr_key text;
