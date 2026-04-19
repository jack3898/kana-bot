import { Events, GatewayIntentBits } from "discord.js";
import { Bot } from "./client";
import * as challenge from "./commands/invite";
import env from "./env";
import { handleInteractionCreateChatCommand } from "./events/interaction-create-chat-command";
import { handleReady } from "./events/ready";

const client = new Bot({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

client.once(Events.ClientReady, handleReady);
client.on(Events.InteractionCreate, handleInteractionCreateChatCommand);

await client.login(env.DISCORD_TOKEN);

client.registerSlashCommand(challenge);

await client.publishSlashCommands();
