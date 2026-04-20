CREATE TABLE `access_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`displayName` varchar(100) NOT NULL,
	`userId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(100) NOT NULL,
	`userCode` varchar(20) NOT NULL,
	`isAdmin` boolean NOT NULL DEFAULT false,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`date` timestamp NOT NULL,
	`endDate` timestamp,
	`location` varchar(500),
	`locationLat` decimal(10,7),
	`locationLng` decimal(10,7),
	`locationInstructions` text,
	`price` decimal(10,2) NOT NULL DEFAULT '500.00',
	`maxGuests` int NOT NULL DEFAULT 40,
	`imageUrl` text,
	`mercadoPagoLink` text,
	`status` enum('draft','published','cancelled','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`qrCode` varchar(128) NOT NULL,
	`status` enum('pending','paid','checked_in','cancelled') NOT NULL DEFAULT 'pending',
	`paymentReference` varchar(255),
	`checkedInAt` timestamp,
	`checkedInBy` int,
	`guestCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_qrCode_unique` UNIQUE(`qrCode`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` enum('event_reminder','location','general','payment','order') NOT NULL DEFAULT 'general',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`status` enum('going','maybe','not_going') NOT NULL,
	`respondedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rsvps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationId` int NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(100) NOT NULL,
	`userCode` varchar(20) NOT NULL,
	`isAdmin` boolean NOT NULL DEFAULT false,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`isOnline` boolean NOT NULL DEFAULT false,
	CONSTRAINT `user_presence_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_presence_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`phone` varchar(20),
	`avatarUrl` text,
	`pushToken` text,
	`hasSetName` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vip_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`invitationId` int NOT NULL,
	`items` text NOT NULL,
	`status` enum('pending','confirmed','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vip_orders_id` PRIMARY KEY(`id`)
);
