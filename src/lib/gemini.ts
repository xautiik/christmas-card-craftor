import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const TEXT_MODEL = "gemini-2.5-flash"; // Standard Flash (not Lite) for better free limits

function requireKey() {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in your environment");
  }
}

let genAI: GoogleGenerativeAI | null = null;

function getClient() {
  requireKey();
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

export async function requestGeminiGreeting(recipient: string, toneSeed: string, language: "auto" | "amharic" = "auto") {
  const languageCue =
    language === "amharic"
      ? "Respond fully in Amharic (Ge'ez script). Compose as a native Amharic Gena greeting—natural phrasing and cultural cues. Ensure the Ge'ez text is complete and not cut off."
      : "Respond in the language that best fits the name and seed text.";
  
  const prompt = `Write a short, two-sentence Ethiopian Christmas (Gena) greeting for "${recipient}". Mention coffee or bonfire ambience. ${languageCue} Prior wording: ${toneSeed}`;
  
  const model = getClient().getGenerativeModel({ model: TEXT_MODEL });
  
  // Note: The correct key in the official SDK is 'generationConfig' (not 'config')
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.85,
      topP: 0.9,
      maxOutputTokens: 500, // Increased to 500 to prevent Amharic cut-offs
    }
  });

  return result.response.text().trim();
}

export async function requestGeminiVerse(seed: string, language: "auto" | "amharic" = "auto") {
  const languageCue =
    language === "amharic"
      ? "Provide a Nativity-related Bible verse directly from the Amharic Bible. Return the text in Amharic (Ge'ez script)." 
      : "Respond in clear English.";
  
  const prompt = `Provide one Bible verse about the birth of Jesus. Output format: "Book Chapter:Verse|verse text". No extra commentary. ${languageCue} Context: ${seed}`;
  
  const model = getClient().getGenerativeModel({ model: TEXT_MODEL });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4, // Lower temperature is better for Bible verses (more accurate)
      topP: 0.9,
      maxOutputTokens: 400, // Increased for Ge'ez script overhead
    }
  });

  return result.response.text().trim();
}
