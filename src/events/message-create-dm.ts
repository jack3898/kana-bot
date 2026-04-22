import { ChannelType, type Message } from "discord.js";
import { appendMessage, getHistory } from "../conversation.js";
import env from "../env.js";
import { ollama } from "../ollama.js";
import {
	buildSystemPrompt,
	extractPathway,
	runPathway,
} from "../pathways/index.js";

export async function handleMessageCreateDm(message: Message): Promise<void> {
	if (message.author.bot) return;
	if (message.channel.type !== ChannelType.DM) return;
	if (!message.content) return;

	await message.channel.sendTyping();

	const userId = message.author.id;
	appendMessage(userId, { role: "user", content: message.content });

	const { message: aiMessage } = await ollama.chat({
		model: env.OLLAMA_MODEL,
		messages: [
			{ role: "system", content: buildSystemPrompt(userId) },
			...getHistory(userId),
		],
		stream: false,
	});

	const rawReply = aiMessage.content ?? "";
	const pathway = extractPathway(rawReply);

	const reply = pathway ? await runPathway(pathway, { userId }) : rawReply;

	appendMessage(userId, { role: "assistant", content: reply });

	await message.reply(reply.slice(0, 1900));
}
