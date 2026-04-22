import { z } from "zod";
import env from "../env.js";

const AnkiConnectEnvelopeSchema = z.object({
	result: z.unknown().nullable(),
	error: z.string().nullable(),
});

export async function ankiConnectRequest<TResult>(
	action: string,
	params: Record<string, unknown> | undefined,
	resultSchema: z.ZodType<TResult>,
): Promise<TResult> {
	const response = await fetch(env.ANKI_URL, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			action,
			version: 6,
			...(params ? { params } : {}),
		}),
	});

	if (!response.ok) {
		throw new Error(`AnkiConnect HTTP ${response.status}`);
	}

	const json = await response.json();
	const envelope = AnkiConnectEnvelopeSchema.safeParse(json);

	if (!envelope.success) {
		throw new Error("Unexpected AnkiConnect response shape.");
	}

	if (envelope.data.error) {
		throw new Error(envelope.data.error);
	}

	const resultParsed = resultSchema.safeParse(envelope.data.result);

	if (!resultParsed.success) {
		throw new Error("Unexpected AnkiConnect result shape.");
	}

	return resultParsed.data;
}

export async function fetchDeckNames(): Promise<string[]> {
	return ankiConnectRequest("deckNames", undefined, z.array(z.string()));
}

export async function findCards(query: string): Promise<number[]> {
	return ankiConnectRequest("findCards", { query }, z.array(z.number()));
}

const CardInfoSchema = z
	.object({
		cardId: z.number(),
		question: z.string(),
		answer: z.string(),
		fields: z.record(
			z.string(),
			z.object({ value: z.string(), order: z.number() }),
		),
	})
	.passthrough();

export type CardInfo = z.infer<typeof CardInfoSchema>;

export async function cardsInfo(cardIds: number[]): Promise<CardInfo[]> {
	return ankiConnectRequest(
		"cardsInfo",
		{ cards: cardIds },
		z.array(CardInfoSchema),
	);
}

export type AnkiEase = 1 | 2 | 3 | 4;

export async function answerCards(
	answers: Array<{ cardId: number; ease: AnkiEase }>,
): Promise<boolean[]> {
	return ankiConnectRequest("answerCards", { answers }, z.array(z.boolean()));
}

export async function guiDeckReview(name: string): Promise<boolean> {
	return ankiConnectRequest("guiDeckReview", { name }, z.boolean());
}

const GuiCurrentCardSchema = z
	.object({
		cardId: z.number(),
		question: z.string(),
		answer: z.string(),
		fields: z.record(
			z.string(),
			z.object({ value: z.string(), order: z.number() }),
		),
	})
	.passthrough();

export type GuiCurrentCard = z.infer<typeof GuiCurrentCardSchema>;

export async function guiCurrentCard(): Promise<GuiCurrentCard | null> {
	return ankiConnectRequest(
		"guiCurrentCard",
		undefined,
		z.union([GuiCurrentCardSchema, z.null()]),
	);
}

export async function guiShowAnswer(): Promise<boolean> {
	return ankiConnectRequest("guiShowAnswer", undefined, z.boolean());
}

export async function guiAnswerCard(ease: AnkiEase): Promise<boolean> {
	return ankiConnectRequest("guiAnswerCard", { ease }, z.boolean());
}

const DeckStatsEntrySchema = z
	.object({
		name: z.string(),
		new_count: z.number(),
		learn_count: z.number(),
		review_count: z.number(),
	})
	.passthrough();

export type DeckStatsEntry = z.infer<typeof DeckStatsEntrySchema>;

export async function getDeckStats(
	deckNames: string[],
): Promise<Record<string, DeckStatsEntry>> {
	return ankiConnectRequest(
		"getDeckStats",
		{ decks: deckNames },
		z.record(z.string(), DeckStatsEntrySchema),
	);
}
