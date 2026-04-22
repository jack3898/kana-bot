export type StudySession = {
	deck: string;
	currentCardId: number;
	currentQuestion: string;
	currentAnswer: string;
	presentedAt: number;
	hints: number;
};

const HTML_ENTITIES: Record<string, string> = {
	"&nbsp;": " ",
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#39;": "'",
	"&apos;": "'",
};

export function stripHtml(value: string): string {
	const withoutBlocks = value
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
	const withoutTags = withoutBlocks
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
		.replace(/<[^>]+>/g, "");
	const decoded = withoutTags.replace(
		/&(?:nbsp|amp|lt|gt|quot|#39|apos);/g,
		(m) => HTML_ENTITIES[m] ?? m,
	);
	return decoded
		.replace(/[ \t]+/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export function pickQuestionText(
	question: string,
	fields: Record<string, { value: string; order: number }>,
): string {
	const stripped = stripHtml(question);
	if (stripped) return stripped;
	const ordered = Object.entries(fields).sort(
		([, a], [, b]) => a.order - b.order,
	);
	for (const [, field] of ordered) {
		const candidate = stripHtml(field.value);
		if (candidate) return candidate;
	}
	return "(empty card)";
}

export function pickAnswerText(
	answer: string,
	question: string,
	fields: Record<string, { value: string; order: number }>,
): string {
	const questionStripped = stripHtml(question);
	const answerStripped = stripHtml(answer);
	if (answerStripped && answerStripped !== questionStripped) {
		const withoutQuestionPrefix = answerStripped
			.replace(questionStripped, "")
			.trim();
		return withoutQuestionPrefix || answerStripped;
	}
	const ordered = Object.entries(fields).sort(
		([, a], [, b]) => a.order - b.order,
	);
	for (const [, field] of ordered.slice(1)) {
		const candidate = stripHtml(field.value);
		if (candidate) return candidate;
	}
	return answerStripped || "(no answer)";
}

export type RemainingCounts = {
	new: number;
	learning: number;
	review: number;
};

export function formatRemaining(counts: RemainingCounts): string {
	const total = counts.new + counts.learning + counts.review;
	if (total === 0) return "No cards left today.";
	const parts: string[] = [];
	if (counts.review > 0) parts.push(`${counts.review} review`);
	if (counts.learning > 0) parts.push(`${counts.learning} learning`);
	if (counts.new > 0) parts.push(`${counts.new} new`);
	return `${total} left today (${parts.join(", ")}).`;
}
