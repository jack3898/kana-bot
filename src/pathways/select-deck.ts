import { setSelectedDeck } from "../user-state.js";
import { fetchDeckNames } from "../utils/anki-connect.js";
import { renderDeckList, resolveDeckChoice } from "./deck-utils.js";
import type { PathwayContext } from "./index.js";

export async function handleSelectDeck(
	name: string,
	ctx: PathwayContext,
): Promise<string> {
	const decks = await fetchDeckNames();
	const choice = resolveDeckChoice(decks, name);

	if ("match" in choice) {
		setSelectedDeck(ctx.userId, choice.match);
		return `Great — "${choice.match}" is now your selected deck. Just say the word when you're ready to start learning.`;
	}
	if ("ambiguous" in choice) {
		return [
			`I found a few decks matching "${name}". Which one did you mean?`,
			"",
			renderDeckList(choice.ambiguous),
		].join("\n");
	}
	return [
		`I couldn't find a deck called "${name}". Here's what's available:`,
		"",
		renderDeckList(decks),
	].join("\n");
}
