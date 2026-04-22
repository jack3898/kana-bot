import { fetchDeckNames } from "../utils/anki-connect.js";
import { renderDeckList } from "./deck-utils.js";

export async function handleDecks(): Promise<string> {
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
