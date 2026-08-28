ALTER TABLE "invitations"
  ADD COLUMN IF NOT EXISTS "access_mode" text NOT NULL DEFAULT 'public';
--> statement-breakpoint
ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_access_mode_check"
  CHECK ("access_mode" IN ('public', 'private'));
