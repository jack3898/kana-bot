import { Client, Collection, REST, Routes } from "discord.js";
import env from "./env.js";
import type { Command } from "./types.js";

export class Bot extends Client {
	readonly commands = new Collection<PropertyKey, Command>();
	readonly rest = new REST();

	/**
	 * Registers a local slash command to later be published to Discord's API.
	 */
	registerSlashCommand(command: Command): void {
		this.commands.set(command.definition.name, command);
	}

	/**
	 * Publishes all local slash commands registered using registerSlashCommands to Discord's API.
	 */
	async publishSlashCommands(): Promise<void> {
		console.info("Publishing slash commands...");

		const route = env.DISCORD_GUILD_ID
			? Routes.applicationGuildCommands(
					env.DISCORD_APPLICATION_ID,
					env.DISCORD_GUILD_ID,
				)
			: Routes.applicationCommands(env.DISCORD_APPLICATION_ID);

		if (!env.DISCORD_GUILD_ID) {
			console.warn(
				"No DISCORD_GUILD_ID was provided, this means the commands will be global and may take up to an hour to propagate.",
			);
		}

		await this.rest.put(route, {
			body: this.commands.map((command) => command.definition.toJSON()),
		});

		console.log("Successfully published slash commands.");
	}
}
