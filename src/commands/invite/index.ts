import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import env from "../../env";

export const definition = new SlashCommandBuilder()
	.setName("invite")
	.setDescription("Create an invite link to invite me to another server.");

const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APPLICATION_ID}&permissions=2147485696&integration_type=0&scope=bot`;

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	await interaction.reply(INVITE_URL);
}
