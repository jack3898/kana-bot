import { ChannelType, type Message } from "discord.js";
import env from "../env.js";
import { ollama } from "../ollama.js";

export async function handleMessageCreateDm(message: Message): Promise<void> {
	if (message.author.bot) {
		return;
	}

	if (message.channel.type !== ChannelType.DM) {
		return;
	}

	if (!message.content) {
		return;
	}

	await message.channel.sendTyping();

	const { response } = await ollama.generate({
		model: env.OLLAMA_MODEL,
		prompt: message.content,
		stream: false,
	});

	await message.reply(response.slice(0, 1900));
}
