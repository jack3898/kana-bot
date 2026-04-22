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
