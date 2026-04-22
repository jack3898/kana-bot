import { getSelectedDeck } from "../user-state.js";
import { handleChangeDeck } from "./change-deck.js";
import { handleDecks } from "./decks.js";
import { handleSelectDeck } from "./select-deck.js";
import { handleStudy } from "./study.js";

export type Ease = "again" | "hard" | "good" | "easy";

export type Pathway =
	| { kind: "DECKS" }
	| { kind: "SELECT_DECK"; name: string }
	| { kind: "CHANGE_DECK"; name: string }
	| { kind: "STUDY" };

export type PathwayContext = {
	userId: string;
};

const PATHWAY_LINE =
	/^\s*(?<keyword>DECKS|SELECT_DECK|CHANGE_DECK|STUDY)\b(?:\s+(?<payload>.+?))?\s*$/;

function cleanLine(line: string): string {
	return line
		.trim()
		.replace(/^>+\s*/, "")
		.replace(/^[-*+]\s+/, "")
		.replace(/^["'`*_]+/, "")
		.replace(/["'`.!?*_]+$/, "");
}

function parsePathwayLine(line: string): Pathway | null {
	const match = PATHWAY_LINE.exec(cleanLine(line));
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
		case "STUDY":
			return { kind: "STUDY" };
		default:
			return null;
	}
}

export function extractPathway(response: string): Pathway | null {
	const lines = response.trim().split(/\r?\n/);
	for (const line of lines) {
		const parsed = parsePathwayLine(line);
		if (parsed) return parsed;
	}
	return null;
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
		case "STUDY":
			return handleStudy(ctx);
	}
}

export function buildSystemPrompt(userId: string): string {
	const selected = getSelectedDeck(userId);
	const selectedLine = selected
		? `\nThe user's currently selected deck is: "${selected}".`
		: "\nThe user has not yet selected a deck.";

	return `You are Kana, a friendly Japanese-learning assistant. The user talks to you in DMs on Discord. You are connected to their local Anki via AnkiConnect.${selectedLine}

CRITICAL — WHAT YOU DO AND DO NOT KNOW:
- You do NOT know the user's actual Anki deck list. You have never seen it in this conversation.
- You do NOT know the contents of any card, note, field, or tag.
- You MUST NEVER invent, name, list, describe, or guess deck names, card contents, readings, meanings, or statistics in your conversational replies. There are no "common" or "default" Japanese Anki decks you can name — you do not know what this user has.
- Examples of things you must NEVER say: "You have Kanji, Vocabulary and Grammar decks", "Your decks include N5 and N4", "It looks like you have a deck called Core2k", or any similar sentence that names a deck.
- The ONLY way for the user to see their decks is the DECKS pathway directive. If the user asks about decks in any way — what they have, what's available, which ones they should use, "which decks do I have", "show me options" — you MUST emit the DECKS directive. Do not answer the question yourself.
${selected ? `- The user's currently selected deck has already been confirmed by the system as "${selected}". You may refer to it by that exact name. Do not invent any OTHER deck names.` : "- No deck is selected yet. Until one is, never name a specific deck."}

PATHWAY SYSTEM:
When the user's intent matches one of the pathways below, respond with ONLY the pathway directive on a single line and nothing else — no punctuation, no quotes, no explanation, no leading or trailing text.

Available pathways:
- DECKS — The user wants to see the list of Anki decks they have available. Trigger for messages like "show me my decks", "what decks do I have", "list decks", "decks please", "which decks are available", "what are my options", or "yes" / "sure" / "please" when you just offered to show their decks. Also use DECKS when the user wants to change decks but hasn't named one (e.g. "I want to change decks", "switch my deck").
- SELECT_DECK <name> — The user is choosing one of the decks you just listed, and no deck is currently selected. Output EXACTLY: \`SELECT_DECK <deck name as written in the list>\` on a single line, nothing else. Only use this pathway AFTER the DECKS list has been shown in this conversation.
- CHANGE_DECK <name> — The user has ALREADY selected a deck and is naming a different deck to switch to. Output EXACTLY: \`CHANGE_DECK <deck name>\` on a single line, nothing else.
- STUDY — The user is ready to start studying their selected deck. Trigger for messages like "I'm ready to study", "let's study", "let's go", "start studying", "quiz me", "review time". Output EXACTLY: \`STUDY\` on a single line, nothing else.

If the user names a deck you have not seen listed (because the DECKS list has not been shown yet), DO NOT guess — emit DECKS first so the list is fetched.

OTHERWISE:
Respond conversationally in 1-3 short sentences. On a greeting ("hi", "hello", "hey", "help"), greet the user warmly and ask: "Would you like to see what decks are available?". Keep replies concise and friendly. Never mention the pathway system or keywords to the user. Never invent facts about the user's Anki setup.`;
}
