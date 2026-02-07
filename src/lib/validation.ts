import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export const aidRequestSchema = z.object({
  category: z.string().min(2),
  amount: z.string().min(1),
  description: z.string().min(10)
});

export const jobFilterSchema = z.object({
  keyword: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional()
});

export const healthLogSchema = z.object({
  mood: z.string(),
  stressLevel: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(12)
});
