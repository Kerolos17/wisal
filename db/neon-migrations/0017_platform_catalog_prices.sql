-- Align only the legacy bootstrap prices with the approved public catalog.
-- Deliberate administrator overrides are preserved by the guarded predicates.
UPDATE public.platform_plans
SET price_egp = CASE code
  WHEN 'starter' THEN 199
  WHEN 'elegant' THEN 599
  ELSE price_egp
END,
updated_at = CURRENT_TIMESTAMP
WHERE (code = 'starter' AND price_egp = 0)
   OR (code = 'elegant' AND price_egp = 899);
