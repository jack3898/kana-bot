import type { StudySession } from "./pathways/study-session.js";

type UserState = {
	selectedDeck?: string;
	studySession?: StudySession;
};

const states = new Map<string, UserState>();

function getOrInit(userId: string): UserState {
	const existing = states.get(userId);
	if (existing) return existing;
	const fresh: UserState = {};
	states.set(userId, fresh);
	return fresh;
}

export function getSelectedDeck(userId: string): string | undefined {
	return states.get(userId)?.selectedDeck;
}

export function setSelectedDeck(userId: string, deck: string): void {
	getOrInit(userId).selectedDeck = deck;
}

export function getStudySession(userId: string): StudySession | undefined {
	return states.get(userId)?.studySession;
}

export function setStudySession(userId: string, session: StudySession): void {
	getOrInit(userId).studySession = session;
}

export function clearStudySession(userId: string): void {
	const existing = states.get(userId);
	if (existing) existing.studySession = undefined;
}
