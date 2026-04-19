import type { CacheType, Interaction } from "discord.js";
import { assertBot } from "../utils/assert.js";

export async function handleInteractionCreateChatCommand(
	interaction: Interaction<CacheType>,
): Promise<void> {
	if (!interaction.isCommand()) {
		return;
	}

	try {
		assertBot(interaction.client);

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`Command not found: ${interaction.commandName}`);

			return;
		}

		await command.execute(interaction);
	} catch (error) {
		console.error(error);
	}
}
