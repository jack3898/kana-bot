import { fetchDeckNames } from "./utils/anki-connect.js";

export const PATHWAY_KEYWORDS = ["DECKS"] as const;
export type PathwayKeyword = (typeof PATHWAY_KEYWORDS)[number];

export const SYSTEM_PROMPT = `You are Kana, a friendly Japanese-learning assistant. The user talks to you in DMs on Discord. You are connected to their local Anki via AnkiConnect.

PATHWAY SYSTEM:
When the user's intent matches one of the pathway keywords below, respond with ONLY that single keyword in uppercase and nothing else — no punctuation, no quotes, no explanation, no leading or trailing whitespace.

Available pathways:
- DECKS: The user wants to see the list of Anki decks they have available. Trigger this for messages like "show me my decks", "what decks do I have", "list decks", "decks please", or a simple "yes" / "sure" / "please" when you have just offered to show their decks.

OTHERWISE:
Respond conversationally in 1-3 short sentences. On a greeting ("hi", "hello", "hey", "help"), greet the user warmly and ask: "Would you like to see what decks are available?". Keep replies concise and friendly. Do not mention the pathway system or keywords to the user.`;

export function extractPathway(response: string): PathwayKeyword | null {
	const trimmed = response
		.trim()
		.replace(/^["'`]+|["'`.!?]+$/g, "")
		.toUpperCase();

	return (PATHWAY_KEYWORDS as readonly string[]).includes(trimmed)
		? (trimmed as PathwayKeyword)
		: null;
}

export async function runPathway(keyword: PathwayKeyword): Promise<string> {
	switch (keyword) {
		case "DECKS": {
			const decks = await fetchDeckNames();

			if (decks.length === 0) {
				return "You don't have any Anki decks yet.";
			}

			return ["Here's your Decks.", "", ...decks.map((d) => `- ${d}`)].join(
				"\n",
			);
		}
	}
}
