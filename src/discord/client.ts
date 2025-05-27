import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { env } from "../env";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once("ready", () => {
  console.log(`Discord bot logged in as ${client.user?.tag}!`);
});

export function initDiscordClient() {
  return client.login(env.DISCORD_BOT_TOKEN);
}

export function getErrorChannel() {
  return client.channels.cache.get(env.ERROR_CHANNEL_ID) as TextChannel | undefined;
}

export function getFeedbackChannel() {
  return client.channels.cache.get(env.FEEDBACK_CHANNEL_ID) as TextChannel | undefined;
} 