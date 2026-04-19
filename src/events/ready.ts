import type { Client } from "discord.js";

export function handleReady(bot: Client): void {
	console.log(`Logged in as ${bot.user?.username}!`);
}
