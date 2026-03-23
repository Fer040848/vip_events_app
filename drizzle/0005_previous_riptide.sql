CREATE TABLE `device_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` text NOT NULL,
	`platform` enum('ios','android','web') NOT NULL,
	`deviceName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `device_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `sent_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`deviceTokenId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','sent','failed','read') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sent_notifications_id` PRIMARY KEY(`id`)
);
