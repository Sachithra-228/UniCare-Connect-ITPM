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

/** Sri Lanka mobile: 9 digits (7XXXXXXXX) or 10 digits (07XXXXXXXX) */
export const sriLankaPhoneSchema = z
  .string()
  .transform((s) => s.replace(/\D/g, ""))
  .refine(
    (s) =>
      s.length === 0 ||
      ((s.length === 9 && s.startsWith("7")) || (s.length === 10 && s.startsWith("07"))),
    { message: "Enter a valid 10-digit number (e.g. 0771234567)" }
  );

/** Optional URL: empty or valid http(s) URL */
export const optionalUrlSchema = z.string().refine(
  (s) => {
    const t = s.trim();
    if (!t) return true;
    return (t.startsWith("http://") || t.startsWith("https://")) && /^https?:\/\/[^\s]+$/.test(t);
  },
  { message: "Enter a valid URL (e.g. https://linkedin.com/in/username)" }
);

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
