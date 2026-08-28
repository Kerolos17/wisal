ALTER TABLE "messages" DROP CONSTRAINT "messages_status_check";--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_status_check" CHECK ("messages"."status" in ('draft', 'scheduled', 'sent', 'failed'));--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("users"."role" in ('admin', 'support', 'content_manager', 'couple'));--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_locale_check";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_locale_check" CHECK ("users"."locale" in ('ar', 'en'));
