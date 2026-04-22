import type { Message } from "ollama";

const MAX_TURNS = 10;

const histories = new Map<string, Message[]>();

export function appendMessage(userId: string, message: Message): void {
	const existing = histories.get(userId) ?? [];

	existing.push(message);

	// Keep the last MAX_TURNS*2 messages (a "turn" is user + assistant).
	const overflow = existing.length - MAX_TURNS * 2;

	if (overflow > 0) {
		existing.splice(0, overflow);
	}

	histories.set(userId, existing);
}

export function getHistory(userId: string): Message[] {
	return histories.get(userId) ?? [];
}
