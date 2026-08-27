-- Phase 1: Manual payment domain (Wisal)
-- Adds the canonical payment tables per docs/MANUAL-PAYMENT-DOMAIN-SPEC.md
-- Safe to re-run: all objects use IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES public.platform_plans (code) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'needs_info', 'rejected', 'approved', 'cancelled')),

  plan_name_snapshot text NOT NULL,
  price_egp_snapshot integer NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  guest_limit_snapshot integer,
  duration_days_snapshot integer NOT NULL,

  payment_method text CHECK (payment_method IN ('instapay', 'vodafone_cash', 'etisalat_cash', 'bank_transfer')),
  amount_paid integer,
  reference_number text,
  payer_name text,
  payer_phone_masked text,

  receipt_key text,
  receipt_mime text,
  receipt_size integer,
  receipt_checksum text,

  reviewed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  admin_notes text,
  info_request_reason text,

  idempotency_key text NOT NULL UNIQUE,
  status_version integer NOT NULL DEFAULT 1,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one pending_review request per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_user_pending_idx
  ON public.payment_requests (user_id)
  WHERE status = 'pending_review';

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES public.platform_plans (code) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  payment_request_id uuid REFERENCES public.payment_requests (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_status_idx
  ON public.user_subscriptions (user_id, status);

CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  payment_request_id uuid REFERENCES public.payment_requests (id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_audit_logs_created_idx
  ON public.payment_audit_logs (created_at);
CREATE INDEX IF NOT EXISTS payment_audit_logs_payment_idx
  ON public.payment_audit_logs (payment_request_id);
