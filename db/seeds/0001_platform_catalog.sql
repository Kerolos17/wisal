-- Explicit, idempotent seed for the public Wisal catalog.
-- Apply only after the platform_templates, platform_plans, and platform_content tables exist.

INSERT INTO public.platform_templates (code, name_ar, name_en, category)
VALUES
  ('love-poem', 'أناقة التحرير', 'Élan Editorial', 'classic'),
  ('garden-night', 'حُلم الحديقة', 'Garden Reverie', 'botanical'),
  ('moonlight', 'قمر زجاجي', 'Glass Moon', 'modern'),
  ('golden-vows', 'الوعد المُذهّب', 'Gilded Promise', 'luxury'),
  ('white-story', 'سُكون', 'Still', 'minimal'),
  ('cinema-night', 'بعد الغروب', 'After Dark', 'cinematic'),
  ('rose-garden', 'وردة حالمة', 'Blush Botanica', 'botanical'),
  ('cathedral-light', 'الميثاق الملكي', 'The Royal Chapel', 'classic'),
  ('desert-sunset', 'صفحات الغروب', 'Sunlit Pages', 'modern'),
  ('velvet-night', 'العرض المخملي', 'Velvet Première', 'luxury'),
  ('coastal-breeze', 'عهود الساحل', 'Barefoot Vows', 'minimal'),
  ('modern-monogram', 'حروف النور', 'Noor Monogram', 'cinematic')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.platform_plans
  (code, name_ar, name_en, price_egp, guest_limit, position, featured, features_ar, features_en)
VALUES
  ('starter', 'البداية', 'Starter', 0, 50, 1, false, '["دعوة واحدة","50 ضيفًا"]'::jsonb, '["One invitation","50 guests"]'::jsonb),
  ('elegant', 'الأنيقة', 'Elegant', 899, 250, 2, true, '["قوالب مميزة","250 ضيفًا","تقارير الحضور"]'::jsonb, '["Premium templates","250 guests","RSVP reports"]'::jsonb),
  ('signature', 'التوقيع', 'Signature', 1699, NULL, 3, false, '["ضيوف بلا حد","تجربة سينمائية","دعم أولوية"]'::jsonb, '["Unlimited guests","Cinematic experience","Priority support"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.platform_content (key, group_name, value_ar, value_en)
VALUES
  ('hero_eyebrow', 'landing', 'دعوتكما، كما تستحق الحكاية', 'Your invitation, worthy of your story'),
  ('hero_description', 'landing', 'صمّما دعوة رقمية راقية، أديرا الضيوف والمواقع، وتابعا الردود بسهولة.', 'Create an elegant digital invitation, manage guests and venues, and track every RSVP.'),
  ('hero_primary_cta', 'landing', 'ابدآ تصميم الدعوة', 'Start designing'),
  ('support_email', 'support', 'support@wisal.app', 'support@wisal.app')
ON CONFLICT (key) DO NOTHING;
