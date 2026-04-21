CREATE TABLE `payment_confirmations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`screenshotUrl` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_confirmations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_link_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentLinkId` int NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	`userAgent` text,
	CONSTRAINT `payment_link_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`url` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_links_id` PRIMARY KEY(`id`)
);
