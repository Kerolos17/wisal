ALTER TABLE invitations ADD COLUMN IF NOT EXISTS show_message boolean NOT NULL DEFAULT true;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS show_countdown boolean NOT NULL DEFAULT true;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS show_schedule boolean NOT NULL DEFAULT true;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS section_order jsonb NOT NULL DEFAULT '["message","countdown","schedule","rsvp"]'::jsonb;
