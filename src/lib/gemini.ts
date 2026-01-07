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

const fallbackVerses = {
  en: [
    "Luke 2:10-11|But the angel said to them, Fear not, for behold, I bring you good news of great joy that will be for all the people. For unto you is born this day in the city of David a Savior, who is Christ the Lord.",
    "Matthew 1:23|Behold, the virgin shall conceive and bear a son, and they shall call his name Immanuel (which means, God with us).",
    "John 1:14|And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth.",
    "Galatians 4:4-5|But when the fullness of time had come, God sent forth his Son, born of woman, born under the law, to redeem those who were under the law, so that we might receive adoption as sons.",
    "Philippians 2:5-7|Have this mind among yourselves, which is yours in Christ Jesus... by taking the form of a servant, being born in the likeness of men.",
    "Luke 2:14|Glory to God in the highest, and on earth peace among those with whom he is pleased!",
    "Matthew 2:6|And you, O Bethlehem... from you shall come a ruler who will shepherd my people Israel.",
    "Luke 2:20|The shepherds returned, glorifying and praising God for all they had heard and seen, as it had been told them.",
    "Matthew 2:2|Where is he who has been born king of the Jews? For we saw his star when it rose and have come to worship him.",
    "Hebrews 1:2-3|In these last days he has spoken to us by his Son... He is the radiance of the glory of God and the exact imprint of his nature.",
    "Isaiah 9:6|For to us a child is born, to us a son is given; and the government shall be upon his shoulder...",
    "Micah 5:2|But you, O Bethlehem Ephrathah... from you shall come forth for me one who is to be ruler in Israel."
  ],
  am: [
    "ሉቃስ 2:10-11|እነሆ፥ ለሕዝቡ ሁሉ የሚሆን ታላቅ ደስታ ወንጌል እነግራችኋለሁ፤ ዛሬም በዳዊት ከተማ ለእናንተ መድኃኒት ተወልዶአል፥ እርሱም ክርስቶስ ጌታ ነው።",
    "ማቴዎስ 1:23|እነሆ፥ ድንግል ትፀንሳለች ወንድ ልጅም ትወልዳለች፥ ስሙንም አማኑኤል በማለት ይጠራሉ፥ ትርጉሙም ከእኛ ጋር ያለ እግዚአብሔር ማለት ነው።",
    "ዮሐንስ 1:14|ቃልም ሥጋ ሆኖ በእኛ ዘንድ ኖረ፥ ከአብ ዘንድ እንደ ሆነ የአንድ ወለድ ክብር ክብሩን አየነው፥ በጸጋና በእውነትም ነበረ።",
    "ገላትያ 4:4-5|ዘመኑ ሙሉ በተለከሰ ጊዜ እግዚአብሔር ልጁን ከሴት የተወለደና ስርየት ሥር ያለ አወረደ፥ ስርየት ሥር ያሉትን ይቤዣቸው በግብርም እኛ የልጅነት መብት እንወርስ ዘንድ።",
    "ፊልጵስዩስ 2:5-7|ይህች አስብ በእናንተ ሁሉ ውስጥ ትኑር፥ በክርስቶስ ኢየሱስም ነበረች፤ ... የባሪያን ምሳሌ ተቀብሎ በሰውም ምሳሌ ሆነ።",
    "ሉቃስ 2:14|ክብር በአርያም ለእግዚአብሔር፥ በምድርም ለሰው መልካም ፈቃድ ሰላም ይሁን።",
    "ማቴዎስ 2:6|አንቺም ይሁዳ የምድር አምባገነን በእነርሱ ውስጥ እንኳ ትንሽ አይደለሽም፤ ከአንቺ ለሕዝቤ እስራኤል የሚገዛ አለቃ ይወጣል።",
    "ሉቃስ 2:20|እረኞቹም እንደ ላቸው እንደሆነ ነገር ሁሉ ሰሙና አዩ ስለዚህም እግዚአብሔርን ያክብሩና ያመሰግኑ ተመለሱ።",
    "ማቴዎስ 2:2|የይሁዳ ንጉሥ የተወለደው ወዴት ነው? ከምሥራቅ ኮከቡን አይተነው መጥተናል እንሰግድለት ዘንድ።",
    "ዕብራውያን 1:2-3|በእነዚህ ዘመናት ውስጥ በልጁ ሆኖ ተናገረብን፤ እርሱ የእግዚአብሔር ክብር ጸሎት ነው ዓለምንም በኃይሉ ቃል የሚያደግ ነው።",
    "ኢሳይያስ 9:6|ወላጅ ልጅ ተሰጥቶናል፥ ሥልጣንም በትከሻው ይሆናል...",
    "ሚክያስ 5:2|አንቺም ኤፍራታ ቤተልሔም... ከአንቺ ለእኔ በእስራኤል የሚገዛ አለቃ ይወጣል።"
  ]
};

let fallbackIndexEn = 0;
let fallbackIndexAm = 0;

const fallbackGreetings = {
  en: [
    "May the glow of the coffee ceremony and the warmth of the bonfire wrap you in peace this Gena season.",
    "Sending you a cozy Gena filled with coffee aroma, candlelight, and the joy of loved ones gathered near.",
    "May green, gold, and red hues brighten your home, and may your table overflow with laughter and peace.",
    "Wishing you a gentle Gena night—sweet drums, soft light, and a heart full of hope.",
    "May the star over Bethlehem remind you of love’s nearness and the warmth of family this Christmas."
  ],
  amNeutral: [
    "የቡና ሽታውና የእጣኑ ሙቀት በዚህ ገና ወቅት ሰላምንና ደስታን ያብዙልህ።",
    "በገና ሌሊት ብርሃን እንዲያበራልህ፣ የደስታ ሳቅ እና የበርበሬ ሽታ ቤትህን እንዲሞላ እመኛለሁ።",
    "የኢትዮጵያ ቀለሞች እንዲያምሩልህ፣ ሰላምና ፍቅርም ቤትህን እንዲያምር እመኛለሁ።",
    "የገና ደስታ በልብህ ይሞላ፣ በኩራትና በማታው ብርሃን ቤትህ ይሞላ።",
    "በገና ሌሊት የተናገረው ብርሃን በቤትህ ይበራ፣ ተስፋንና ደስታን ይጨምርልህ።"
  ],
  amFemale: [
    "የቡና ሽታውና የእጣኑ ሙቀት በዚህ ገና ወቅት ሰላምንና ደስታን ያብዙልሽ።",
    "በገና ሌሊት ብርሃን እንዲያበራልሽ፣ የደስታ ሳቅ እና የበርበሬ ሽታ ቤትሽን እንዲሞላ እመኛለሁ።",
    "የኢትዮጵያ ቀለሞች እንዲያምሩልሽ፣ ሰላምና ፍቅርም ቤትሽን እንዲያምር እመኛለሁ።",
    "የገና ደስታ በልብሽ ይሞላ፣ በኩራትና በማታው ብርሃን ቤትሽ ይሞላ።",
    "በገና ሌሊት የተናገረው ብርሃን በቤትሽ ይበራ፣ ተስፋንና ደስታን ይጨምርልሽ።"
  ]
};

let fallbackGreetingIndexEn = 0;
let fallbackGreetingIndexAmNeutral = 0;
let fallbackGreetingIndexAmFemale = 0;

function pickFallbackGreeting(language: "auto" | "amharic", gender: "neutral" | "female" | "male") {
  if (language === "amharic" && gender === "female" && fallbackGreetings.amFemale.length) {
    const line = fallbackGreetings.amFemale[fallbackGreetingIndexAmFemale % fallbackGreetings.amFemale.length];
    fallbackGreetingIndexAmFemale += 1;
    return line;
  }

  if (language === "amharic") {
    const pool = fallbackGreetings.amNeutral;
    if (pool.length === 0) {
      return "Warm Gena wishes to you and yours.";
    }
    const line = pool[fallbackGreetingIndexAmNeutral % pool.length];
    fallbackGreetingIndexAmNeutral += 1;
    return line;
  }

  const pool = fallbackGreetings.en;
  if (pool.length === 0) {
    return "Warm Gena wishes to you and yours.";
  }
  const line = pool[fallbackGreetingIndexEn % pool.length];
  fallbackGreetingIndexEn += 1;
  return line;
}

function pickFallback(language: "auto" | "amharic") {
  const pool = language === "amharic" ? fallbackVerses.am : fallbackVerses.en;
  if (pool.length === 0) {
    return "Luke 2:10-11|Fear not, for behold, I bring you good news of great joy.";
  }
  if (language === "amharic") {
    const verse = pool[fallbackIndexAm % pool.length];
    fallbackIndexAm += 1;
    return verse;
  }
  const verse = pool[fallbackIndexEn % pool.length];
  fallbackIndexEn += 1;
  return verse;
}

export async function requestGeminiGreeting(
  recipient: string,
  toneSeed: string,
  language: "auto" | "amharic" = "auto",
  gender: "neutral" | "female" | "male" = "neutral"
) {
  const languageCue =
    language === "amharic"
      ? "Respond fully in Amharic (Ge'ez script). Keep it concise, musical, and warm."
      : "Respond in the language that best fits the name and seed text.";
  const prompt = `Write a short, two-sentence Ethiopian Christmas (Gena) greeting that feels cozy and modern. Address the note to "${recipient}". Keep it warm, mention coffee ceremony or bonfire ambience, and blend Ethiopian colors (green, gold, red) into imagery. Stay inclusive and avoid religious dogma. Do not mention New Year—this is only about Christmas/Gena. ${languageCue} Prior wording: ${toneSeed}`;
  try {
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
      return pickFallbackGreeting(language, gender);
    }
    return firstText.trim();
  } catch (error) {
    console.warn("Gemini greeting failed, using fallback", error);
    return pickFallbackGreeting(language, gender);
  }
}

export async function requestGeminiVerse(seed: string, language: "auto" | "amharic" = "auto") {
  const languageCue =
    language === "amharic"
      ? "Respond with the verse text in Amharic (Ge'ez script) and the reference transliterated as usual."
      : "Respond in clear English.";
  const prompt = `Provide one Bible verse about the birth of Jesus (Nativity / Christmas). Output exactly in the format "Book Chapter:Verse|verse text" with no extra commentary, labels, or English indicators. ${languageCue} Keep it short and warm. Seed context: ${seed}`;
  try {
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
      return pickFallback(language);
    }
    return firstText.trim();
  } catch (error) {
    console.warn("Gemini verse failed, using fallback", error);
    return pickFallback(language);
  }
}
