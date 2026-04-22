import { getSelectedDeck, setStudySession } from "../user-state.js";
import {
	getDeckStats,
	guiCurrentCard,
	guiDeckReview,
} from "../utils/anki-connect.js";
import { presentCardForDiscord } from "./card-presentation.js";
import type { PathwayContext } from "./index.js";
import {
	formatRemaining,
	pickAnswerText,
	pickQuestionText,
	type StudySession,
} from "./study-session.js";

export async function handleStudy(ctx: PathwayContext): Promise<string> {
	const deck = getSelectedDeck(ctx.userId);
	if (!deck) {
		return "You haven't picked a deck yet — would you like to see what decks are available?";
	}

	const opened = await guiDeckReview(deck);
	if (!opened) {
		return `I couldn't open "${deck}" for review in Anki. Make sure Anki is running and try again.`;
	}

	const card = await guiCurrentCard();
	if (!card) {
		return `Nothing to study in "${deck}" right now — nice work!`;
	}

	const question = pickQuestionText(card.question, card.fields);
	const answer = pickAnswerText(card.answer, card.question, card.fields);

	const session: StudySession = {
		deck,
		currentCardId: card.cardId,
		currentQuestion: question,
		currentAnswer: answer,
		presentedAt: Date.now(),
		hints: 0,
	};
	setStudySession(ctx.userId, session);

	const [stats, display] = await Promise.all([
		getDeckStats([deck]),
		presentCardForDiscord(question),
	]);
	const entry = Object.values(stats)[0];
	const remainingLine = entry
		? formatRemaining({
				new: entry.new_count,
				learning: entry.learn_count,
				review: entry.review_count,
			})
		: "";

	const lines = [`You're studying "${deck}".`];
	if (remainingLine) lines.push(remainingLine);
	lines.push(
		"",
		"Here's your first card:",
		"",
		display,
		"",
		'Reply with your answer, ask for a hint, or say "stop" to end the session.',
	);
	return lines.join("\n");
}
