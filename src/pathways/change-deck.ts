import { getSelectedDeck, setSelectedDeck } from "../user-state.js";
import { fetchDeckNames } from "../utils/anki-connect.js";
import { renderDeckList, resolveDeckChoice } from "./deck-utils.js";
import type { PathwayContext } from "./index.js";

export async function handleChangeDeck(
	name: string,
	ctx: PathwayContext,
): Promise<string> {
	const decks = await fetchDeckNames();
	const choice = resolveDeckChoice(decks, name);

	if ("match" in choice) {
		const previous = getSelectedDeck(ctx.userId);
		if (previous === choice.match) {
			return `"${choice.match}" is already your selected deck — nothing to change.`;
		}
		setSelectedDeck(ctx.userId, choice.match);
		return previous
			? `Swapped from "${previous}" to "${choice.match}". Ready whenever you are.`
			: `Selected "${choice.match}" as your deck. Ready whenever you are.`;
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
