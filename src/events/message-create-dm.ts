import { ChannelType, type Message } from "discord.js";
import { appendMessage, getHistory } from "../conversation.js";
import env from "../env.js";
import { ollama } from "../ollama.js";
import {
	buildSystemPrompt,
	extractPathway,
	runPathway,
} from "../pathways/index.js";
import { handleStudyTurn } from "../pathways/study-turn.js";
import { getStudySession } from "../user-state.js";

export async function handleMessageCreateDm(message: Message): Promise<void> {
	if (message.author.bot) return;
	if (message.channel.type !== ChannelType.DM) return;
	if (!message.content) return;

	await message.channel.sendTyping();

	const userId = message.author.id;
	const userText = message.content;

	let reply: string;
	try {
		if (getStudySession(userId)) {
			reply = await handleStudyTurn(userText, { userId });
		} else {
			reply = await runChatTurn(userId, userText);
		}
	} catch (error) {
		console.error("Failed to handle DM:", error);
		reply =
			"Sorry, something went wrong on my end. Give me another try in a moment.";
	}

	await message.reply(reply.slice(0, 1900));
}

async function runChatTurn(userId: string, userText: string): Promise<string> {
	appendMessage(userId, { role: "user", content: userText });

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
	return reply;
}
