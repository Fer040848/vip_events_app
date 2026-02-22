ALTER TABLE `users` ADD `pushToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `hasSetName` boolean DEFAULT false NOT NULL;