CREATE TABLE `chat_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(100) NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(100) NOT NULL,
	`photoUrl` text NOT NULL,
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_photos_id` PRIMARY KEY(`id`)
);
