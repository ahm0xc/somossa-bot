import { TextChannel } from "discord.js";
import { LogErrorPayload, Feedback } from "./validation";

export function createErrorEmbed(payload: LogErrorPayload) {
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

  return embed;
}

export function createFeedbackEmbed(feedback: Feedback) {
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

  return embed;
}

export function validateTextChannel(channel: any) {
  if (!channel) {
    return { success: false, error: "Channel not found" };
  }

  if (!(channel instanceof TextChannel)) {
    return { success: false, error: "Channel is not a TextChannel" };
  }

  return { success: true, channel };
} 