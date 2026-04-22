import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { fetchDeckNames } from "../../utils/anki-connect.js";

export const definition = new SlashCommandBuilder()
	.setName("decks")
	.setDescription("List available Anki decks.");

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	try {
		const decks = await fetchDeckNames();

		const lines =
			decks.length === 0
				? ["Here's your Decks.", "", "_No decks found._"]
				: ["Here's your Decks.", "", ...decks.map((d) => `- ${d}`)];

		await interaction.reply(lines.join("\n"));
	} catch (error) {
		console.error(error);
		await interaction.reply(
			"Sorry—couldn't reach AnkiConnect. Make sure Anki is open, AnkiConnect is installed, and `ANKI_URL` is correct.",
		);
	}
}
