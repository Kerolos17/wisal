-- Add duration_days to platform_plans (referenced by payment snapshot logic)
ALTER TABLE public.platform_plans ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 365;

-- Backfill: signature plan = 1 year, others = 1 year default
-- (no per-plan override needed for Phase 1)
