import { Events, GatewayIntentBits } from "discord.js";
import { Bot } from "./client.js";
import * as decks from "./commands/decks/index.js";
import * as invite from "./commands/invite/index.js";
import env from "./env.js";
import { handleInteractionCreateChatCommand } from "./events/interaction-create-chat-command.js";
import { handleReady } from "./events/ready.js";

const client = new Bot({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

client.once(Events.ClientReady, handleReady);
client.on(Events.InteractionCreate, handleInteractionCreateChatCommand);

await client.login(env.DISCORD_TOKEN);

client.registerSlashCommand(invite);
client.registerSlashCommand(decks);

await client.publishSlashCommands();
