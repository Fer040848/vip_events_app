CREATE TABLE `rsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`status` enum('going','maybe','not_going') NOT NULL,
	`respondedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rsvps_id` PRIMARY KEY(`id`)
);
