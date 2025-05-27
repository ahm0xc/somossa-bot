import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";

import { env } from "./env";
import { z } from "zod";

const app = new Hono();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once("ready", () => {
  console.log(`Discord bot logged in as ${client.user?.tag}!`);
});

client.login(env.DISCORD_BOT_TOKEN);

app.get("/health", (c) =>
  c.json({
    status: "ok",
    discord: client.isReady() ? "connected" : "disconnected",
  })
);

const logErrorPayloadSchema = z.object({
  type: z.enum(["error", "warning", "info"]).default("info"),
  appName: z.string(),
  message: z.string(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
  metadata: z.record(z.string(), z.any()).optional(),
  stack: z.string().optional(),
  url: z.string().url().optional(),
});

app.post("/log", async (c) => {
  const channel = client.channels.cache.get(env.ERROR_CHANNEL_ID);
  if (!channel)
    return c.json({ status: "error", message: "Channel not found" }, 500);

  if (!(channel instanceof TextChannel)) {
    return c.json(
      { status: "error", message: "Channel is not a TextChannel" },
      500
    );
  }

  const unsafeBody = await c.req.json();
  const bodyResult = logErrorPayloadSchema.safeParse(unsafeBody);
  if (bodyResult.error)
    return c.json({ status: "error", message: bodyResult.error.message }, 400);
  const payload = bodyResult.data;

  const typeEmoji = {
    error: "🔴",
    warning: "🟠",
    info: "🔵",
  }[payload.type];

  const embed = {
    color: payload.type === "error" ? 0xFF0000 : payload.type === "warning" ? 0xFFAA00 : 0x0099FF,
    title: `${typeEmoji} ${payload.appName}`,
    description: payload.message,
    fields: [
      { name: "Type", value: payload.type, inline: true },
      { name: "Timestamp", value: `<t:${Math.floor(new Date(payload.timestamp).getTime() / 1000)}:F>`, inline: true },
    ],
    timestamp: payload.timestamp,
  };

  if (payload.stack) {
    embed.fields.push({ name: "Stack Trace", value: `\`\`\`\n${payload.stack.slice(0, 1000)}\n\`\`\``, inline: false });
  }

  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    embed.fields.push({ 
      name: "Metadata", 
      value: `\`\`\`json\n${JSON.stringify(payload.metadata, null, 2).slice(0, 1000)}\n\`\`\``,
      inline: false
    });
  }

  if (payload.url) {
    embed.fields.push({ name: "URL", value: payload.url, inline: false });
  }

  await channel.send({ embeds: [embed] });

  return c.json({ status: "ok" });
});

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

// graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
