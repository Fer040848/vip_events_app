ALTER TABLE `device_tokens` DROP INDEX `device_tokens_token_unique`;--> statement-breakpoint
CREATE INDEX `token_idx` ON `device_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `user_notif_idx` ON `sent_notifications` (`userId`,`notificationId`);