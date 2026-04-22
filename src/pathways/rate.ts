import {
	clearStudySession,
	getStudySession,
	setStudySession,
} from "../user-state.js";
import {
	type AnkiEase,
	getDeckStats,
	guiAnswerCard,
	guiCurrentCard,
	guiShowAnswer,
} from "../utils/anki-connect.js";
import { presentCardForDiscord } from "./card-presentation.js";
import type { Ease, PathwayContext } from "./index.js";
import {
	formatRemaining,
	pickAnswerText,
	pickQuestionText,
	type StudySession,
} from "./study-session.js";

const EASE_TO_ANKI: Record<Ease, AnkiEase> = {
	again: 1,
	hard: 2,
	good: 3,
	easy: 4,
};

export async function handleRate(
	ease: Ease,
	ctx: PathwayContext,
): Promise<string> {
	const session = getStudySession(ctx.userId);
	if (!session) {
		return "You're not in a study session right now. Say the word when you want to start studying.";
	}

	const shown = await guiShowAnswer();
	if (!shown) {
		console.warn(
			`guiShowAnswer returned false before rating card ${session.currentCardId}. Anki may not be in review mode.`,
		);
	}
	const accepted = await guiAnswerCard(EASE_TO_ANKI[ease]);
	console.log(
		`Rated card ${session.currentCardId} as ${ease} (ease ${EASE_TO_ANKI[ease]}). Accepted: ${accepted}.`,
	);
	if (!accepted) {
		console.error(
			`guiAnswerCard returned false for card ${session.currentCardId} with ease ${ease}.`,
		);
		return "Anki didn't accept the rating just now — make sure the review window is still open in Anki and try answering again.";
	}

	const prefix =
		ease === "again"
			? `Not quite — the answer was: ${session.currentAnswer}`
			: ease === "hard"
				? `Got it — marking that as hard. The answer was: ${session.currentAnswer}`
				: ease === "easy"
					? "Nailed it — marking that as easy!"
					: "Correct!";

	const next = await guiCurrentCard();
	if (!next) {
		clearStudySession(ctx.userId);
		return [
			prefix,
			"",
			`That's all your cards for "${session.deck}" today — session complete! Great work.`,
		].join("\n");
	}

	if (next.cardId === session.currentCardId) {
		console.log(
			`Anki scheduler returned the same card (${next.cardId}) after "${ease}" — this is expected for learning steps with few cards in the queue.`,
		);
	} else {
		console.log(
			`Advanced from card ${session.currentCardId} to ${next.cardId} after "${ease}".`,
		);
	}

	const question = pickQuestionText(next.question, next.fields);
	const answer = pickAnswerText(next.answer, next.question, next.fields);

	const nextSession: StudySession = {
		deck: session.deck,
		currentCardId: next.cardId,
		currentQuestion: question,
		currentAnswer: answer,
		presentedAt: Date.now(),
		hints: 0,
	};
	setStudySession(ctx.userId, nextSession);

	const [stats, display] = await Promise.all([
		getDeckStats([session.deck]),
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

	const lines = [prefix, ""];
	if (remainingLine) lines.push(remainingLine, "");
	lines.push("Next card:", "", display);
	return lines.join("\n");
}
