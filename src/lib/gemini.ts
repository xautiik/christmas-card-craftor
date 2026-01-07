import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const TEXT_MODEL = "gemini-2.5-flash-lite";

function requireKey() {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in your environment");
  }
}

let client: GoogleGenAI | null = null;

function getClient() {
  requireKey();
  if (!client) {
    client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return client;
}

export async function requestGeminiGreeting(recipient: string, toneSeed: string, language: "auto" | "amharic" = "auto") {
  const languageCue =
    language === "amharic"
      ? "Respond fully in Amharic (Ge'ez script). Keep it concise, musical, and warm."
      : "Respond in the language that best fits the name and seed text.";
  const prompt = `Write a short, two-sentence Ethiopian Christmas (Gena) greeting that feels cozy and modern. Address the note to "${recipient}". Keep it warm, mention coffee ceremony or bonfire ambience, and blend Ethiopian colors (green, gold, red) into imagery. Stay inclusive and avoid religious dogma. Do not mention New Year—this is only about Christmas/Gena. ${languageCue} Prior wording: ${toneSeed}`;
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    config: {
      temperature: 0.85,
      topP: 0.9,
      maxOutputTokens: 180
    }
  });

  const firstText = response?.candidates?.[0]?.content?.parts?.find((part: any) => part.text)?.text as string | undefined;
  if (!firstText) {
    throw new Error("Gemini returned no text");
  }
  return firstText.trim();
}

export async function requestGeminiVerse(seed: string, language: "auto" | "amharic" = "auto") {
  const languageCue =
    language === "amharic"
      ? "Respond with the verse text in Amharic (Ge'ez script) and the reference transliterated as usual."
      : "Respond in clear English.";
  const prompt = `Provide one Bible verse about the birth of Jesus (Nativity / Christmas). Output exactly in the format "Book Chapter:Verse|verse text" with no extra commentary, labels, or language indicators. Do NOT repeat or append the reference after the verse text. ${languageCue} Keep it short and warm. Seed context: ${seed}`;
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    config: {
      temperature: 0.65,
      topP: 0.9,
      maxOutputTokens: 120
    }
  });

  const firstText = response?.candidates?.[0]?.content?.parts?.find((part: any) => part.text)?.text as string | undefined;
  if (!firstText) {
    throw new Error("Gemini returned no verse");
  }
  return firstText.trim();
}
