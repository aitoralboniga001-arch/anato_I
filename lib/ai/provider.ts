import { createGoogleGenerativeAI } from "@ai-sdk/google";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

/** Returns the configured server-side tutor model, or null for local fallback mode. */
export function getTutorModel() {
  if (process.env.AI_TUTOR_ENABLED !== "true") return null;
  const provider = process.env.AI_PROVIDER || "google";
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (provider !== "google" || !apiKey) return null;

  const google = createGoogleGenerativeAI({ apiKey });
  return google(process.env.AI_MODEL || DEFAULT_MODEL);
}
