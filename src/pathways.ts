import { getSelectedDeck, setSelectedDeck } from "./user-state.js";
import { fetchDeckNames } from "./utils/anki-connect.js";

export type Pathway = { kind: "DECKS" } | { kind: "SELECT_DECK"; name: string };

export type PathwayContext = {
	userId: string;
};

export function buildSystemPrompt(userId: string): string {
	const selected = getSelectedDeck(userId);
	const selectedLine = selected
		? `\nThe user's currently selected deck is: "${selected}".`
		: "\nThe user has not yet selected a deck.";

	return `You are Kana, a friendly Japanese-learning assistant. The user talks to you in DMs on Discord. You are connected to their local Anki via AnkiConnect.${selectedLine}

PATHWAY SYSTEM:
When the user's intent matches one of the pathways below, respond with ONLY the pathway directive and nothing else — no punctuation, no quotes, no explanation, no leading or trailing text.

Available pathways:
- DECKS — The user wants to see the list of Anki decks they have available. Trigger for messages like "show me my decks", "what decks do I have", "list decks", "decks please", or "yes" / "sure" / "please" when you just offered to show their decks.
- SELECT_DECK <name> — The user is choosing one of the decks you just listed. Output EXACTLY: \`SELECT_DECK <deck name as written in the list>\` on a single line, nothing else. Only use this pathway AFTER the DECKS list has been shown in this conversation. If the user's choice is ambiguous, ask a clarifying question conversationally instead of emitting the pathway.

OTHERWISE:
Respond conversationally in 1-3 short sentences. On a greeting ("hi", "hello", "hey", "help"), greet the user warmly and ask: "Would you like to see what decks are available?". Keep replies concise and friendly. Never mention the pathway system or keywords to the user.`;
}

const PATHWAY_LINE =
	/^\s*(?<keyword>DECKS|SELECT_DECK)(?:\s+(?<payload>.+?))?\s*$/s;

export function extractPathway(response: string): Pathway | null {
	const firstLine = response.trim().split(/\r?\n/)[0] ?? "";
	const stripped = firstLine.replace(/^["'`]+|["'`.!?]+$/g, "");
	const match = PATHWAY_LINE.exec(stripped);
	if (!match?.groups) return null;

	const { keyword, payload } = match.groups;
	if (keyword === "DECKS") return { kind: "DECKS" };
	if (keyword === "SELECT_DECK") {
		const name = payload?.trim().replace(/^["'`]+|["'`]+$/g, "") ?? "";
		return name ? { kind: "SELECT_DECK", name } : null;
	}
	return null;
}

function renderDeckList(decks: string[]): string {
	return decks.map((d) => `- ${d}`).join("\n");
}

function resolveDeckChoice(
	decks: string[],
	query: string,
): { match: string } | { ambiguous: string[] } | { notFound: true } {
	const normalized = query.trim().toLowerCase();
	const exact = decks.find((d) => d.toLowerCase() === normalized);
	if (exact) return { match: exact };

	const contains = decks.filter((d) => d.toLowerCase().includes(normalized));
	if (contains.length === 1) return { match: contains[0] as string };
	if (contains.length > 1) return { ambiguous: contains };
	return { notFound: true };
}

export async function runPathway(
	pathway: Pathway,
	ctx: PathwayContext,
): Promise<string> {
	switch (pathway.kind) {
		case "DECKS": {
			const decks = await fetchDeckNames();
			if (decks.length === 0) {
				return "You don't have any Anki decks yet.";
			}
			return [
				"Here's your Decks.",
				"",
				renderDeckList(decks),
				"",
				"Which one would you like to study with? Just tell me the name.",
			].join("\n");
		}

		case "SELECT_DECK": {
			const decks = await fetchDeckNames();
			const choice = resolveDeckChoice(decks, pathway.name);

			if ("match" in choice) {
				setSelectedDeck(ctx.userId, choice.match);
				return `Great — "${choice.match}" is now your selected deck. Just say the word when you're ready to start learning.`;
			}
			if ("ambiguous" in choice) {
				return [
					`I found a few decks matching "${pathway.name}". Which one did you mean?`,
					"",
					renderDeckList(choice.ambiguous),
				].join("\n");
			}
			return [
				`I couldn't find a deck called "${pathway.name}". Here's what's available:`,
				"",
				renderDeckList(decks),
			].join("\n");
		}
	}
}
