import { Hono } from "hono";
import { TextChannel } from "discord.js";
import { getErrorChannel } from "../discord/client";
import { logSchema } from "../lib/validation";
import { createErrorEmbed, validateTextChannel } from "../lib/utils";

const route = new Hono();

route.post("/", async (c) => {
  const errorChannel = getErrorChannel();
  const channelValidation = validateTextChannel(errorChannel);
  
  if (!channelValidation.success) {
    return c.json({ status: "error", message: channelValidation.error }, 500);
  }

  const channel = channelValidation.channel as TextChannel;

  const unsafeBody = await c.req.json();
  const bodyResult = logSchema.safeParse(unsafeBody);
  
  if (bodyResult.error) {
    return c.json({ status: "error", message: bodyResult.error.message }, 400);
  }
  
  const payload = bodyResult.data;
  const embed = createErrorEmbed(payload);

  await channel.send({ embeds: [embed] });

  return c.json({ status: "ok" });
});

export default route; 