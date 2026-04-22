import env from "../env.js";
import { ollama } from "../ollama.js";
import type { Ease } from "./index.js";

export type StudyIntent = "answer" | "hint" | "stop" | "dontknow";

const INTENT_SYSTEM_PROMPT = `You classify a single user message sent during an active Anki study session.

Reply with EXACTLY ONE of these four lowercase words on its own line, NOTHING else:

stop
hint
dontknow
answer

Meaning:
- stop: user wants to end the study session entirely.
- hint: user explicitly asks for a hint/help/clue without attempting an answer.
- dontknow: user concedes they don't know the answer (without attempting one).
- answer: user is attempting to provide an answer (even a wrong one).

Examples (input -> output):
"stop" -> stop
"quit" -> stop
"I'm done" -> stop
"end session" -> stop
"pause" -> stop
"enough for today" -> stop

"hint" -> hint
"hint please" -> hint
"give me a hint" -> hint
"can you help me?" -> hint
"nudge me" -> hint
"I need a clue" -> hint

"idk" -> dontknow
"I don't know" -> dontknow
"no clue" -> dontknow
"no idea" -> dontknow
"not a clue" -> dontknow
"dunno" -> dontknow
"haven't got a clue" -> dontknow
"pass" -> dontknow
"skip" -> dontknow
"next" -> dontknow
"forgot" -> dontknow
"can't remember" -> dontknow
"show me" -> dontknow
"show me the answer" -> dontknow
"tell me" -> dontknow
"what is it" -> dontknow
"?" -> dontknow
"???" -> dontknow
"umm" -> dontknow

"ka" -> answer
"ki" -> answer
"ki?" -> answer
"ka?" -> answer
"mizu" -> answer
"mizu?" -> answer
"water" -> answer
"I think it's ka" -> answer
"maybe 水" -> answer
"maybe 水?" -> answer
"the reading is にち" -> answer
"it means house" -> answer
"hi" -> answer
"a" -> answer

Key rule: a short attempt with a trailing "?" (like "ki?" or "water?") is still an ANSWER — the "?" just means the user is uncertain. Only treat "?" or "???" ALONE (with no other characters) as dontknow.

Output exactly one of: stop, hint, dontknow, answer. No other text.`;

export async function classifyStudyIntent(
	userText: string,
): Promise<StudyIntent> {
	const { message } = await ollama.chat({
		model: env.OLLAMA_MODEL,
		stream: false,
		messages: [
			{ role: "system", content: INTENT_SYSTEM_PROMPT },
			{ role: "user", content: userText },
		],
	});
	const word = (message.content ?? "")
		.trim()
		.toLowerCase()
		.split(/[^a-z]+/)
		.find((chunk) => chunk.length > 0);
	if (
		word === "stop" ||
		word === "hint" ||
		word === "dontknow" ||
		word === "answer"
	) {
		return word;
	}
	console.warn(
		`classifyStudyIntent fell back to "answer" for ambiguous model output: ${JSON.stringify(message.content)}`,
	);
	return "answer";
}

const JUDGE_SYSTEM_PROMPT = `You judge whether a user's answer to an Anki flashcard matches the expected answer.

Reply with EXACTLY ONE lowercase word on its own line, NOTHING else:

correct
incorrect

NORMALIZATION — apply mentally before comparing:
- Ignore leading and trailing punctuation on the user's answer. A trailing "?" means the user is uncertain, NOT that they're asking a question. Treat "ki?" EXACTLY the same as "ki".
- Ignore capitalization, quotes, and extra whitespace on both sides.
- The expected answer may contain formatting / metadata like "Katakana: 'ki'", "(mizu)", "kanji — water", etc. The core target is usually a reading, a meaning, or a character buried inside that text.

COMPARISON RULES:
- If the user's answer (after normalization) appears inside the expected answer as a reading, meaning, kana, or kanji, output "correct".
- For Japanese cards, treat these as equivalent: the expected answer as written, its romaji, its hiragana, its katakana, its kanji form, and its English meaning. Any one of them matching is "correct".
- Ignore minor typos (one or two characters off), capitalisation, stray punctuation, quotes, and spacing.
- Only output "incorrect" if the user's answer is empty, clearly unrelated, or contradicts the expected answer.

Examples (input -> output):
Expected: "Katakana: 'ki'"    User: "ki"          -> correct
Expected: "Katakana: 'ki'"    User: "ki?"         -> correct
Expected: "Katakana: 'ki'"    User: "KI"          -> correct
Expected: "Katakana: 'ki'"    User: "ka"          -> incorrect
Expected: "Katakana: 'ki'"    User: ""            -> incorrect
Expected: "水 (mizu) water"    User: "water"       -> correct
Expected: "水 (mizu) water"    User: "mizu"        -> correct
Expected: "水 (mizu) water"    User: "水"           -> correct
Expected: "水 (mizu) water"    User: "mizu?"       -> correct
Expected: "水 (mizu) water"    User: "fire"        -> incorrect
Expected: "Hiragana: 'a'"     User: "a."          -> correct
Expected: "Hiragana: 'a'"     User: "'a'"         -> correct

Output exactly one of: correct, incorrect.`;

function normalizeUserAnswer(raw: string): string {
	return raw
		.trim()
		.replace(/^["'`“”‘’]+|["'`“”‘’.?!]+$/g, "")
		.trim();
}

export async function judgeAnswer(params: {
	question: string;
	expectedAnswer: string;
	userAnswer: string;
}): Promise<"correct" | "incorrect"> {
	const normalized = normalizeUserAnswer(params.userAnswer);
	if (!normalized) return "incorrect";

	const { message } = await ollama.chat({
		model: env.OLLAMA_MODEL,
		stream: false,
		messages: [
			{ role: "system", content: JUDGE_SYSTEM_PROMPT },
			{
				role: "user",
				content: `Question shown to user:
${params.question}

Expected answer:
${params.expectedAnswer}

User's response (already stripped of trailing punctuation):
${normalized}

Is the user's response correct?`,
			},
		],
	});
	const word = (message.content ?? "")
		.trim()
		.toLowerCase()
		.split(/[^a-z]+/)
		.find((chunk) => chunk.length > 0);
	if (word === "correct") return "correct";
	if (word === "incorrect") return "incorrect";
	console.warn(
		`judgeAnswer fell back to "incorrect" for ambiguous model output: ${JSON.stringify(message.content)}`,
	);
	return "incorrect";
}

export function pickConfidence(ctx: {
	hintsGiven: number;
	secondsElapsed: number;
}): Exclude<Ease, "again"> {
	if (ctx.hintsGiven > 0) return "hard";
	if (ctx.secondsElapsed <= 5) return "easy";
	if (ctx.secondsElapsed <= 20) return "good";
	return "hard";
}
