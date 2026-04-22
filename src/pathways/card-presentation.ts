import env from "../env.js";
import { ollama } from "../ollama.js";

const SYSTEM_PROMPT = `You are reformatting an Anki flashcard front for a Discord DM.

Input: the raw text of a card's front (after HTML has been stripped). It may be a single word, a character, a sentence, or a multi-field card with several pieces of information.

Your job: present the same content in a clean, readable Discord message.

Rules:
- Preserve every piece of information from the input. Do not invent, translate, add context, or remove anything.
- Do NOT reveal or guess an answer.
- Do NOT add commentary, explanations, greetings, or meta-text like "Here is the card".
- Use Discord markdown sparingly: bold for the main prompt/word; short bullet points only if there are multiple distinct fields.
- Short cards (single word, single sentence) should be returned almost as-is, just tidied — do not pad them with bullets.
- No code blocks, no quote blocks, no headings.
- Output only the formatted card text, nothing else.`;

export async function presentCardForDiscord(
	rawQuestion: string,
): Promise<string> {
	const trimmed = rawQuestion.trim();
	if (!trimmed) return rawQuestion;

	try {
		const { message } = await ollama.chat({
			model: env.OLLAMA_MODEL,
			stream: false,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: trimmed },
			],
		});
		const content = (message.content ?? "").trim();
		return content || rawQuestion;
	} catch (error) {
		console.error("Failed to summarize card:", error);
		return rawQuestion;
	}
}
