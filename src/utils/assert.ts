import type { Client } from "discord.js";
import { Bot } from "../client.js";

/**
 * This application uses an extended version of the Discord.js Client class.
 * This function asserts that the provided instance is an instance of the Bot class.
 */
export function assertBot(instance: Client): asserts instance is Bot {
	if (!(instance instanceof Bot)) {
		throw new Error("The provided instance is not a Discord.js Client.");
	}
}
