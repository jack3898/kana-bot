import { prettifyError, z } from "zod";

const EnvSchema = z.object({
	DISCORD_TOKEN: z.string(),
	DISCORD_APPLICATION_ID: z.string(),
	DISCORD_GUILD_ID: z.string(),
});

export type Env = z.output<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
	throw new Error(prettifyError(parsed.error));
}

export default parsed.data;
