ALTER TABLE `guests` ADD `invite_token` text;--> statement-breakpoint
ALTER TABLE `guests` ADD `opened_at` text;--> statement-breakpoint
ALTER TABLE `guests` ADD `responded_at` text;--> statement-breakpoint
UPDATE `guests` SET `invite_token` = lower(hex(randomblob(16))) WHERE `invite_token` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `guests_invite_token_unique` ON `guests` (`invite_token`);
