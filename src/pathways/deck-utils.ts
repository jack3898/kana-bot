export function renderDeckList(decks: string[]): string {
	return decks.map((d) => `- ${d}`).join("\n");
}

export type DeckMatch =
	| { match: string }
	| { ambiguous: string[] }
	| { notFound: true };

export function resolveDeckChoice(decks: string[], query: string): DeckMatch {
	const normalized = query.trim().toLowerCase();
	const exact = decks.find((d) => d.toLowerCase() === normalized);
	if (exact) return { match: exact };

	const contains = decks.filter((d) => d.toLowerCase().includes(normalized));
	if (contains.length === 1) return { match: contains[0] as string };
	if (contains.length > 1) return { ambiguous: contains };
	return { notFound: true };
}
