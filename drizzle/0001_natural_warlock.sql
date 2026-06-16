CREATE TABLE `bot_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`discordToken` text NOT NULL,
	`blocklyWorkspace` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bot_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discord_user_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`discordId` varchar(64) NOT NULL,
	`discordUsername` varchar(255) NOT NULL,
	`guildsData` json,
	`membersData` json,
	`accessToken` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discord_user_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `discord_user_cache_userId_unique` UNIQUE(`userId`)
);
