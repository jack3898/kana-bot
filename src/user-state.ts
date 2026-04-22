type UserState = {
	selectedDeck?: string;
};

const states = new Map<string, UserState>();

export function getSelectedDeck(userId: string): string | undefined {
	return states.get(userId)?.selectedDeck;
}

export function setSelectedDeck(userId: string, deck: string): void {
	const existing = states.get(userId) ?? {};
	existing.selectedDeck = deck;
	states.set(userId, existing);
}
