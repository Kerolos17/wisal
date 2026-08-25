ALTER TABLE `events` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `accent_color` text DEFAULT 'plum' NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `font_style` text DEFAULT 'classic' NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `rsvp_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `meal_question_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `max_party_size` integer DEFAULT 2 NOT NULL;
