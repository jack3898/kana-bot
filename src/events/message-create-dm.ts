import { ChannelType, type Message } from "discord.js";
import { appendMessage, getHistory } from "../conversation.js";
import env from "../env.js";
import { ollama } from "../ollama.js";
import { extractPathway, runPathway, SYSTEM_PROMPT } from "../pathways.js";

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
			{ role: "system", content: SYSTEM_PROMPT },
			...getHistory(userId),
		],
		stream: false,
	});

	const rawReply = aiMessage.content ?? "";
	const pathway = extractPathway(rawReply);

	let reply: string;

	if (pathway) {
		reply = await runPathway(pathway);
	} else {
		reply = rawReply;
	}

	appendMessage(userId, { role: "assistant", content: reply });

	await message.reply(reply.slice(0, 1900));
}
