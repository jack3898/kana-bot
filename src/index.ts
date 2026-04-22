import { Events, GatewayIntentBits } from "discord.js";
import { Bot } from "./client.js";
import * as challenge from "./commands/invite/index.js";
import env from "./env.js";
import { handleInteractionCreateChatCommand } from "./events/interaction-create-chat-command.js";
import { handleReady } from "./events/ready.js";

const client = new Bot({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

client.once(Events.ClientReady, handleReady);
client.on(Events.InteractionCreate, handleInteractionCreateChatCommand);

await client.login(env.DISCORD_TOKEN);

client.registerSlashCommand(challenge);

await client.publishSlashCommands();
