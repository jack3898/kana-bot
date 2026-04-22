import { clearStudySession, getStudySession } from "../user-state.js";
import type { PathwayContext } from "./index.js";

export async function handleEndSession(ctx: PathwayContext): Promise<string> {
	const session = getStudySession(ctx.userId);
	if (!session) {
		return "You weren't in a study session — nothing to stop.";
	}
	clearStudySession(ctx.userId);
	return `Okay, stopping your study session for "${session.deck}". Say the word when you're ready to pick it back up.`;
}
