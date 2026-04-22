import { getSelectedDeck } from "../user-state.js";
import { handleChangeDeck } from "./change-deck.js";
import { handleDecks } from "./decks.js";
import { handleSelectDeck } from "./select-deck.js";

export type Pathway =
	| { kind: "DECKS" }
	| { kind: "SELECT_DECK"; name: string }
	| { kind: "CHANGE_DECK"; name: string };

export type PathwayContext = {
	userId: string;
};

const PATHWAY_LINE =
	/^\s*(?<keyword>DECKS|SELECT_DECK|CHANGE_DECK)(?:\s+(?<payload>.+?))?\s*$/s;

export function extractPathway(response: string): Pathway | null {
	const firstLine = response.trim().split(/\r?\n/)[0] ?? "";
	const stripped = firstLine.replace(/^["'`]+|["'`.!?]+$/g, "");
	const match = PATHWAY_LINE.exec(stripped);
	if (!match?.groups) return null;

	const { keyword, payload } = match.groups;
	const name = payload?.trim().replace(/^["'`]+|["'`]+$/g, "") ?? "";

	switch (keyword) {
		case "DECKS":
			return { kind: "DECKS" };
		case "SELECT_DECK":
			return name ? { kind: "SELECT_DECK", name } : null;
		case "CHANGE_DECK":
			return name ? { kind: "CHANGE_DECK", name } : null;
		default:
			return null;
	}
}

export async function runPathway(
	pathway: Pathway,
	ctx: PathwayContext,
): Promise<string> {
	switch (pathway.kind) {
		case "DECKS":
			return handleDecks();
		case "SELECT_DECK":
			return handleSelectDeck(pathway.name, ctx);
		case "CHANGE_DECK":
			return handleChangeDeck(pathway.name, ctx);
	}
}

export function buildSystemPrompt(userId: string): string {
	const selected = getSelectedDeck(userId);
	const selectedLine = selected
		? `\nThe user's currently selected deck is: "${selected}".`
		: "\nThe user has not yet selected a deck.";

	return `You are Kana, a friendly Japanese-learning assistant. The user talks to you in DMs on Discord. You are connected to their local Anki via AnkiConnect.${selectedLine}

PATHWAY SYSTEM:
When the user's intent matches one of the pathways below, respond with ONLY the pathway directive and nothing else — no punctuation, no quotes, no explanation, no leading or trailing text.

Available pathways:
- DECKS — The user wants to see the list of Anki decks they have available. Trigger for messages like "show me my decks", "what decks do I have", "list decks", "decks please", or "yes" / "sure" / "please" when you just offered to show their decks. Also use DECKS when the user wants to change decks but hasn't named one (e.g. "I want to change decks", "switch my deck").
- SELECT_DECK <name> — The user is choosing one of the decks you just listed, and no deck is currently selected. Output EXACTLY: \`SELECT_DECK <deck name as written in the list>\` on a single line, nothing else. Only use this pathway AFTER the DECKS list has been shown in this conversation.
- CHANGE_DECK <name> — The user has ALREADY selected a deck and is naming a different deck to switch to. Examples: "change to Kanji", "switch to Vocabulary", "swap decks to Grammar", "actually use the Kanji deck instead". Output EXACTLY: \`CHANGE_DECK <deck name>\` on a single line, nothing else.

If the user's choice is ambiguous or they haven't named a specific deck, ask a clarifying question conversationally instead of emitting a pathway.

OTHERWISE:
Respond conversationally in 1-3 short sentences. On a greeting ("hi", "hello", "hey", "help"), greet the user warmly and ask: "Would you like to see what decks are available?". Keep replies concise and friendly. Never mention the pathway system or keywords to the user.`;
}
