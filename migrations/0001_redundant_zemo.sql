CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`user_id` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `items` (`user_id`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `items` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userIdNameIdx` ON `items` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `userIdUrlIdx` ON `items` (`user_id`,`url`);--> statement-breakpoint
CREATE INDEX `userIdCreatedAtIdx` ON `items` (`user_id`,`createdAt`);