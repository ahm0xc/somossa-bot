import { Hono } from "hono";
import { TextChannel } from "discord.js";
import { getFeedbackChannel } from "../discord/client";
import { feedbackSchema } from "../lib/validation";
import { createFeedbackEmbed, validateTextChannel } from "../lib/utils";

const route = new Hono();

route.post("/", async (c) => {
  const feedbackChannel = getFeedbackChannel();
  const channelValidation = validateTextChannel(feedbackChannel);
  
  if (!channelValidation.success) {
    return c.json({ status: "error", message: channelValidation.error }, 500);
  }

  const channel = channelValidation.channel as TextChannel;

  const unsafeBody = await c.req.json();
  const bodyResult = feedbackSchema.safeParse(unsafeBody);
  
  if (bodyResult.error) {
    return c.json({ status: "error", message: bodyResult.error.message }, 400);
  }
  
  const feedback = bodyResult.data;
  const embed = createFeedbackEmbed(feedback);

  await channel.send({ embeds: [embed] });

  return c.json({ status: "ok" });
});

export default route; 