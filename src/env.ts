import { config } from "dotenv";
import { z } from "zod";

config();

export const EnvSchema = z.object({
  DISCORD_BOT_TOKEN: z.string(),
  PORT: z.string().default("3000").transform(Number),
  ERROR_CHANNEL_ID: z.string(),
  FEEDBACK_CHANNEL_ID: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line node/no-process-env
export const env = EnvSchema.parse(process.env);
