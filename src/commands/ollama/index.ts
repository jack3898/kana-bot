import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import env from "../../env.js";
import { ollama } from "../../ollama.js";

export const definition = new SlashCommandBuilder()
	.setName("ollama")
	.setDescription("Test Ollama by running a prompt.");

async function generateTestPrompt(): Promise<string> {
	const result = await ollama.generate({
		model: env.OLLAMA_MODEL,
		prompt:
			"Tell the user you're working and have been set up successfully in one sentence!",
		stream: false,
	});

	return result.response;
}

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	await interaction.deferReply();

	const output = await generateTestPrompt();

	await interaction.editReply(output);
}
