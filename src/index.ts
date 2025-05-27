import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { bearerAuth } from "hono/bearer-auth";

import { env } from "./env";
import { z } from "zod";

const app = new Hono();

app.use("*", bearerAuth({ token: env.SECRET_KEY }));

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
  timestamp: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  metadata: z.record(z.string(), z.any()).optional(),
  stack: z.string().optional(),
  url: z.string().url().optional(),
});

const feedbackSchema = z.object({
  appName: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().min(1, "Feedback message cannot be empty"),
  rating: z.number().min(1).max(5).optional(),
  source: z.string().optional(),
  timestamp: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  metadata: z.record(z.string(), z.any()).optional(),
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
    color:
      payload.type === "error"
        ? 0xff0000
        : payload.type === "warning"
        ? 0xffaa00
        : 0x0099ff,
    title: `${typeEmoji} ${payload.appName}`,
    description: payload.message,
    fields: [
      { name: "Type", value: payload.type, inline: true },
      {
        name: "Timestamp",
        value: `<t:${Math.floor(
          new Date(payload.timestamp).getTime() / 1000
        )}:F>`,
        inline: true,
      },
    ],
    timestamp: payload.timestamp,
  };

  if (payload.stack) {
    embed.fields.push({
      name: "Stack Trace",
      value: `\`\`\`\n${payload.stack.slice(0, 1000)}\n\`\`\``,
      inline: false,
    });
  }

  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    embed.fields.push({
      name: "Metadata",
      value: `\`\`\`json\n${JSON.stringify(payload.metadata, null, 2).slice(
        0,
        1000
      )}\n\`\`\``,
      inline: false,
    });
  }

  if (payload.url) {
    embed.fields.push({ name: "URL", value: payload.url, inline: false });
  }

  await channel.send({ embeds: [embed] });

  return c.json({ status: "ok" });
});

app.post("/feedback", async (c) => {
  const channel = client.channels.cache.get(env.FEEDBACK_CHANNEL_ID);
  if (!channel)
    return c.json(
      { status: "error", message: "Feedback channel not found" },
      500
    );

  if (!(channel instanceof TextChannel)) {
    return c.json(
      { status: "error", message: "Channel is not a TextChannel" },
      500
    );
  }

  const unsafeBody = await c.req.json();
  const bodyResult = feedbackSchema.safeParse(unsafeBody);
  if (bodyResult.error)
    return c.json({ status: "error", message: bodyResult.error.message }, 400);

  const feedback = bodyResult.data;

  const stars = feedback.rating ? "⭐".repeat(feedback.rating) : "";

  const embed = {
    color: 0x4caf50,
    title: `📝 New Feedback from **${feedback.appName}** ${stars}`,
    description: feedback.message,
    fields: [] as { name: string; value: string; inline?: boolean }[],
    timestamp: feedback.timestamp,
  };

  embed.fields.push({
    name: "Application",
    value: `**${feedback.appName}**`,
    inline: true,
  });

  if (feedback.name) {
    embed.fields.push({ name: "Name", value: feedback.name, inline: true });
  }

  if (feedback.email) {
    embed.fields.push({ name: "Email", value: feedback.email, inline: true });
  }

  if (feedback.source) {
    embed.fields.push({ name: "Source", value: feedback.source, inline: true });
  }

  if (feedback.metadata && Object.keys(feedback.metadata).length > 0) {
    embed.fields.push({
      name: "Additional Information",
      value: `\`\`\`json\n${JSON.stringify(feedback.metadata, null, 2).slice(
        0,
        1000
      )}\n\`\`\``,
      inline: false,
    });
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
