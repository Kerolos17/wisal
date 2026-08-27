-- Payment integrity: one active subscription per account.
-- Run after checking for any existing duplicate active rows.
CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_one_active_idx
  ON public.user_subscriptions (user_id)
  WHERE status = 'active';
