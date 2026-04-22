import { prettifyError, z } from "zod";

const EnvSchema = z.object({
	DISCORD_TOKEN: z.string(),
	DISCORD_APPLICATION_ID: z.string(),
	DISCORD_GUILD_ID: z.string(),
	ANKI_URL: z.string().url(),
	OLLAMA_URL: z.string().url().default("http://127.0.0.1:11434"),
	OLLAMA_MODEL: z.string().default("llama3.1"),
});

export type Env = z.output<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
	throw new Error(prettifyError(parsed.error));
}

export default parsed.data;
