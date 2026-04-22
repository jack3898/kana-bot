import { getStudySession } from "../user-state.js";
import { handleEndSession } from "./end-session.js";
import { handleHint } from "./hint.js";
import type { PathwayContext } from "./index.js";
import { handleRate } from "./rate.js";
import {
	classifyStudyIntent,
	judgeAnswer,
	pickConfidence,
} from "./study-judge.js";

export async function handleStudyTurn(
	userText: string,
	ctx: PathwayContext,
): Promise<string> {
	const session = getStudySession(ctx.userId);
	if (!session) {
		return "You're not in a study session right now. Say the word when you want to start studying.";
	}

	const intent = await classifyStudyIntent(userText);

	switch (intent) {
		case "stop":
			return handleEndSession(ctx);
		case "hint":
			return handleHint(ctx);
		case "dontknow":
			return handleRate("again", ctx);
		case "answer": {
			const verdict = await judgeAnswer({
				question: session.currentQuestion,
				expectedAnswer: session.currentAnswer,
				userAnswer: userText,
			});
			if (verdict === "incorrect") {
				return handleRate("again", ctx);
			}
			const secondsElapsed = Math.max(
				0,
				Math.round((Date.now() - session.presentedAt) / 1000),
			);
			const ease = pickConfidence({
				hintsGiven: session.hints,
				secondsElapsed,
			});
			return handleRate(ease, ctx);
		}
	}
}
