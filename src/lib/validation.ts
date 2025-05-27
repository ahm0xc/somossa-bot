import { z } from "zod";

export const logSchema = z.object({
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

export type LogErrorPayload = z.infer<typeof logSchema>;

export const feedbackSchema = z.object({
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

export type Feedback = z.infer<typeof feedbackSchema>; 