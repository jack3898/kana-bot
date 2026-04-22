import env from "../env.js";
import { ollama } from "../ollama.js";
import { getStudySession, setStudySession } from "../user-state.js";
import type { PathwayContext } from "./index.js";

export async function handleHint(ctx: PathwayContext): Promise<string> {
	const session = getStudySession(ctx.userId);
	if (!session) {
		return "You're not in a study session right now. Say the word when you want to start studying.";
	}

	const hintNumber = session.hints + 1;

	const { message } = await ollama.chat({
		model: env.OLLAMA_MODEL,
		stream: false,
		messages: [
			{
				role: "system",
				content: `You are Kana, a Japanese-learning tutor. Give a single, short, subtle hint for the flashcard below. DO NOT reveal the full answer. Keep it to one sentence, no more than 15 words. Progressive hint level: ${hintNumber} (1 = very subtle, 3+ = more direct but still not the full answer). Do not mention pathways, keywords, or the hint number. Just the hint text.`,
			},
			{
				role: "user",
				content: `Card front: ${session.currentQuestion}\nExpected answer (do not reveal): ${session.currentAnswer}\n\nGive hint #${hintNumber}.`,
			},
		],
	});

	const hintText =
		(message.content ?? "").trim() || "Think about it a moment longer.";

	setStudySession(ctx.userId, {
		...session,
		hints: hintNumber,
	});

	return `Hint: ${hintText}`;
}
