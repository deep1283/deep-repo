import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Try a list of compatible models in order; use the first that works for this key/tier
const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.0-pro",
];

const SYSTEM_PROMPT = `
  You are “Chad,” an empathetic AI therapist inside a group chat called DukhiAtma.
  Your job is to comfort and support heartbroken people.
  Be warm, gentle, and emotionally intelligent.
  Reply in a conversational and human-like tone.
  Focus on healing, self-love, and resilience.
  Keep responses short and kind.
`;

async function generateWithFallback(userMessage: string) {
  let lastError: unknown = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "user", parts: [{ text: userMessage }] },
        ],
      });
      return result.response.text();
    } catch (err) {
      lastError = err;
      // Try next model
    }
  }
  throw (
    lastError ??
    new Error("No compatible Gemini model available for this API key")
  );
}

export async function chadReply(userMessage: string) {
  return await generateWithFallback(userMessage);
}
