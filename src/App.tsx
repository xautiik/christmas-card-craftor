import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { Clipboard, Download, Facebook, Gift, Link as LinkIcon, Linkedin, MessageSquare, Share2, Snowflake, Sparkles, Twitter } from "lucide-react";
import { Badge } from "./components/Badge";
import { requestGeminiGreeting, requestGeminiVerse } from "./lib/gemini";

const defaultMessage = "May the warmth of the Gena bonfire, the hum of coffee ceremony, and the rhythm of Ethiopian drums fill every corner of your home this season.";
const fallbackRecipient = "friend";

type ShareTarget = {
  label: string;
  icon: LucideIcon;
  url: (payload: string) => string;
};

type FormSection = {
  id: string;
  label: string;
  ref: React.RefObject<HTMLDivElement>;
};

const shareTargets: ShareTarget[] = [
  {
    label: "WhatsApp",
    icon: MessageSquare,
    url: (payload) => `https://wa.me/?text=${payload}`
  },
  {
    label: "X / Twitter",
    icon: Twitter,
    url: (payload) => `https://twitter.com/intent/tweet?text=${payload}`
  },
  {
    label: "LinkedIn",
    icon: Linkedin,
    url: (payload) => `https://www.linkedin.com/sharing/share-offsite/?url=https://gena-card.vercel.app&summary=${payload}`
  },
  {
    label: "Facebook",
    icon: Facebook,
    url: (payload) => `https://www.facebook.com/sharer/sharer.php?u=https://gena-card.vercel.app&quote=${payload}`
  }
];

const builtInImages = [
  { label: "Image 1", url: "/images/image-1.png" },
  { label: "Image 2", url: "/images/image-2.png" },
  { label: "Image 3", url: "/images/image-3.png" },
  { label: "Image 4", url: "/images/image-4.png" }
];

export default function App() {
  const [recipient, setRecipient] = useState("ስም");
  const [message, setMessage] = useState(defaultMessage);
  const [previewRecipient, setPreviewRecipient] = useState("ስም");
  const [previewMessage, setPreviewMessage] = useState(defaultMessage);
  const [verseRef, setVerseRef] = useState("");
  const [verseText, setVerseText] = useState("");
  const [previewVerseRef, setPreviewVerseRef] = useState("Luke 2:10-11");
  const [previewVerseText, setPreviewVerseText] = useState("\"Fear not, for behold, I bring you good news of great joy... For unto you is born this day in the city of David a Savior, who is Christ the Lord.\"");
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [isAiVerse, setIsAiVerse] = useState(false);
  const [preferAmharic, setPreferAmharic] = useState(false);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageHeight, setImageHeight] = useState(192);
  const [cardScale, setCardScale] = useState(1);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimer = useRef<number>();
  const greetingSectionRef = useRef<HTMLDivElement>(null);
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const bibleSectionRef = useRef<HTMLDivElement>(null);
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const generateSectionRef = useRef<HTMLDivElement>(null);
  const shareSectionRef = useRef<HTMLDivElement>(null);
  const downloadSectionRef = useRef<HTMLDivElement>(null);

  const formSections: FormSection[] = [
    { id: "greeting", label: "Greeting & verse", ref: greetingSectionRef },
    { id: "image", label: "Card imagery", ref: imageSectionRef },
    { id: "actions", label: "Generate, share, download", ref: generateSectionRef }
  ];

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        window.clearTimeout(statusTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    setCardScale(1);
  }, []);

  const shareNote = useMemo(
    () => `ገና እንኳን ደስ አለዎት ${previewRecipient || fallbackRecipient}! ${previewMessage || defaultMessage}`,
    [previewRecipient, previewMessage]
  );

  const shareEncoded = encodeURIComponent(shareNote);
  const shareLink = "https://gena-card.vercel.app";

  const clearStatus = (message: string) => {
    setStatus(message);
    if (statusTimer.current) {
      window.clearTimeout(statusTimer.current);
    }
    statusTimer.current = window.setTimeout(() => setStatus(""), 3200);
  };

  const handleAiBlessing = async () => {
    setIsAiWriting(true);
    setErrorMessage("");
    setStatus("Asking Gemini for a wish…");
    try {
      const aiText = await requestGeminiGreeting(recipient || fallbackRecipient, previewMessage || defaultMessage, preferAmharic ? "amharic" : "auto");
      setMessage(aiText);
      setPreviewMessage(aiText);
      setPreviewRecipient(recipient.trim() || fallbackRecipient);
      clearStatus("Gemini wrote a fresh blessing");
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || "Gemini request failed");
      clearStatus("Unable to reach Gemini");
    } finally {
      setIsAiWriting(false);
    }
  };

  const handleAiVerse = async () => {
    setIsAiVerse(true);
    setErrorMessage("");
    setStatus("Finding a Christmas verse…");
    try {
      const aiVerse = await requestGeminiVerse(previewMessage || defaultMessage, preferAmharic ? "amharic" : "auto");
      const [refPart, textPart] = aiVerse.split("|");
      const trimmedRef = (refPart || "").trim();
      const trimmedText = (textPart || aiVerse).trim();
      const cleanedText = trimmedText.replace(/\s+[\p{L}’'`-]+\s?\d+:\d+(?:-\d+)?$/u, "").trim();
      setVerseRef(trimmedRef);
      setVerseText(cleanedText);
      setPreviewVerseRef(trimmedRef || previewVerseRef);
      setPreviewVerseText(cleanedText || previewVerseText);
      clearStatus("Verse added to card");
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || "Gemini verse request failed");
      clearStatus("Unable to fetch verse");
    } finally {
      setIsAiVerse(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) {
      return;
    }
    setIsDownloading(true);
    const cardEl = cardRef.current;
    const previousWidth = cardEl.style.width;
    const previousMaxWidth = cardEl.style.maxWidth;
    const previousMinWidth = cardEl.style.minWidth;
    cardEl.style.width = "600px";
    cardEl.style.maxWidth = "600px";
    cardEl.style.minWidth = "600px";
    try {
      const blob = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "transparent",
        style: { backgroundColor: "transparent" }
      });
      const link = document.createElement("a");
      link.download = `${(recipient || fallbackRecipient).replace(/\s+/g, "-")}-gena-card.png`;
      link.href = blob;
      link.click();
      clearStatus("Card saved to downloads");
    } catch (error) {
      console.error(error);
      clearStatus("Unable to generate the card image");
    } finally {
      cardEl.style.width = previousWidth;
      cardEl.style.maxWidth = previousMaxWidth;
      cardEl.style.minWidth = previousMinWidth;
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      clearStatus("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareNote);
      clearStatus("Blessing copied to clipboard");
    } catch (error) {
      console.error(error);
      clearStatus("Copying failed");
    }
  };

  const handleCopyLink = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      clearStatus("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      clearStatus("Link copied");
    } catch (error) {
      console.error(error);
      clearStatus("Copy link failed");
    }
  };

  const handleGenerate = () => {
    setPreviewRecipient(recipient.trim() || fallbackRecipient);
    setPreviewMessage(message.trim() || defaultMessage);
    setPreviewVerseRef(verseRef.trim() || previewVerseRef);
    setPreviewVerseText(verseText.trim() || previewVerseText);
    clearStatus("Card preview updated");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSource(reader.result as string);
      clearStatus("Card image added");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlApply = () => {
    if (!imageUrlInput.trim()) {
      setImageSource(null);
      clearStatus("Card image cleared");
      return;
    }
    setImageSource(imageUrlInput.trim());
    clearStatus("Card image set from URL");
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      clearStatus("Native share is not supported");
      return;
    }
    try {
      await navigator.share({ title: "Ethiopian Gena Card", text: shareNote });
      clearStatus("Shared via device dialog");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error(error);
        clearStatus("Share failed or was cancelled");
      }
    }
  };

  const handleShare = (url: string) => {
    window.open(url, "_blank", "noreferrer");
    clearStatus("Share dialog ready");
  };

  const handleBuiltInSelect = (url: string) => {
    setImageSource(url);
    setImageUrlInput(url);
    clearStatus("Card image set");
  };

  const scrollToSection = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), formSections.length - 1);
    setCurrentSectionIndex(clamped);
  };

  const handlePrevSection = () => {
    scrollToSection(currentSectionIndex - 1);
  };

  const handleNextSection = () => {
    scrollToSection(currentSectionIndex + 1);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#020617] text-slate-50">
      <div className="relative isolate overflow-hidden bg-gena-smoke px-4 py-12 sm:px-6 sm:py-14">
        <div className="pointer-events-none absolute inset-0 card-outline" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 hero-aurora" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-32 right-16 hidden h-72 w-72 rounded-full blur-3xl floating-orb orb-one md:block" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-12 left-[-36px] hidden h-64 w-64 rounded-full blur-3xl floating-orb orb-two md:block" aria-hidden="true" />
        <div className="mx-auto max-w-6xl space-y-10">
          <header className="space-y-4 text-center">
            <Badge variant="glow">ገና 2018</Badge>
            <p className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
              Craft a beautiful Ethiopian Christmas card with warmth, coffee, and candlelight.
            </p>
            <p className="mx-auto max-w-2xl text-lg text-slate-200">
              Add your recipient’s name, fine-tune the blessing, generate the card, then share or download a glowing መልካም ገና keepsake.
            </p>
          </header>

          <div className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)]">
            <section
              className="flex min-w-0 flex-col space-y-6 rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-5 shadow-card-glow backdrop-blur sm:p-6"
            >
              <div className="flex-1 space-y-6 overflow-y-auto pr-0 sm:pr-1">
                <div
                  ref={greetingSectionRef}
                  className={clsx("space-y-6", currentSectionIndex !== 0 && "hidden")}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">Personalize the greeting</h2>
                    </div>
                    <label className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400" htmlFor="recipient-input">
                      Recipient name (English or Amharic)
                    </label>
                    <input
                      id="recipient-input"
                      className="w-full rounded-2xl border border-slate-800 bg-transparent px-4 py-3 text-lg font-semibold text-white outline-none transition focus:border-emerald-300"
                      placeholder="ስም"
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="message-input" className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                          Message
                        </label>
                        <span className="text-xs text-slate-500">Keep it warm</span>
                      </div>
                      <textarea
                        id="message-input"
                        rows={4}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-base text-slate-200 outline-none transition focus:border-emerald-300"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                 <div
                  ref={bibleSectionRef}
                  className={clsx(
                    "grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200",
                    currentSectionIndex !== 0 && "hidden"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-emerald-200">Bible verse</p>
                    <span className="text-xs text-slate-500">Christmas / Nativity</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.25em] text-slate-400" htmlFor="verse-ref">
                        Reference (book & verse)
                      </label>
                      <input
                        id="verse-ref"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-300"
                        placeholder="Luke 2:10-11"
                        value={verseRef}
                        onChange={(event) => setVerseRef(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.25em] text-slate-400" htmlFor="verse-text">
                        Verse text
                      </label>
                      <textarea
                        id="verse-text"
                        rows={3}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-300"
                        placeholder="Fear not, for behold, I bring you good news of great joy..."
                        value={verseText}
                        onChange={(event) => setVerseText(event.target.value)}
                      />
                    </div>
                  </div>
                 <p className="text-[11px] text-slate-400">Add your own Nativity verse or let Gemini suggest one. Use Generate card to lock it into the preview.</p>
                </div>

                <div
                  ref={aiSectionRef}
                  className={clsx(
                    "grid gap-3 rounded-2xl border border-emerald-500/15 bg-slate-950/50 p-4 text-sm text-slate-200",
                    currentSectionIndex !== 0 && "hidden"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-emerald-200">Gemini assists</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
                    <label className="flex items-center gap-2" htmlFor="amharic-toggle">
                      <input
                        id="amharic-toggle"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-400"
                        checked={preferAmharic}
                        onChange={(event) => setPreferAmharic(event.target.checked)}
                      />
                      <span className="font-semibold">Generate in Amharic</span>
                    </label>
                    <span className="text-[11px] text-slate-400">When on, blessings use ግዕዝ script.</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={isAiWriting}
                      onClick={handleAiBlessing}
                      className={clsx(
                        "flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-400/20 px-4 py-3 font-semibold text-emerald-50 transition",
                        isAiWriting ? "opacity-60" : "hover:border-emerald-300 hover:bg-emerald-400/30"
                      )}
                    >
                      <Sparkles size={16} />
                      {isAiWriting ? "Writing…" : "Craft wish"}
                    </button>
                    <button
                      type="button"
                      disabled={isAiVerse}
                      onClick={handleAiVerse}
                      className={clsx(
                        "flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-400/15 px-4 py-3 font-semibold text-amber-50 transition",
                        isAiVerse ? "opacity-60" : "hover:border-amber-300 hover:bg-amber-400/25"
                      )}
                    >
                      <Snowflake size={16} />
                      {isAiVerse ? "Finding verse…" : "Bible verse"}
                    </button>
                  </div>
                  {errorMessage ? <p className="text-xs text-rose-300">{errorMessage}</p> : <p className="text-xs text-slate-400">Auto-craft a blessing.</p>}
                </div>

               

                <div
                  ref={imageSectionRef}
                  className={clsx(
                    "grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200",
                    currentSectionIndex !== 1 && "hidden"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-emerald-200">Card imagery</p>
                    <span className="text-xs text-slate-500">Upload or paste a link</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                    <input
                      type="url"
                      placeholder="https://example.com/your-image.png"
                      value={imageUrlInput}
                      onChange={(event) => setImageUrlInput(event.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-300"
                    />
                    <button
                      type="button"
                      onClick={handleImageUrlApply}
                      className="rounded-xl border border-emerald-500/40 bg-emerald-400/20 px-3 py-2 text-sm font-semibold text-emerald-50 transition hover:border-emerald-300 hover:bg-emerald-400/30"
                    >
                      Apply URL
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-3 file:py-2 file:text-emerald-50 file:font-semibold"
                    />
                    {imageSource ? <span className="text-xs text-emerald-300">Custom image set</span> : <span className="text-xs text-slate-400">Optional: enrich the card with your own art</span>}
                  </div>

                  <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">Image height</span>
                      <span className="text-[11px] text-slate-400">{imageHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min={140}
                      max={320}
                      step={8}
                      value={imageHeight}
                      onChange={(event) => setImageHeight(Number(event.target.value))}
                      className="accent-emerald-400"
                    />
                    <p className="text-[11px] text-slate-500">Resize the image area inside the card.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Built-in images</p>
                    <div className="grid grid-cols-2 gap-3">
                      {builtInImages.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleBuiltInSelect(item.url)}
                          className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 text-left shadow-sm transition hover:border-emerald-400"
                        >
                          <img
                            src={item.url}
                            loading="lazy"
                            alt={item.label}
                            className="h-28 w-full object-cover"
                          />
                          <div className="px-3 py-2 text-xs font-semibold text-slate-100 group-hover:text-emerald-200">
                            {item.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  ref={generateSectionRef}
                  className={clsx(
                    "space-y-4 rounded-2xl bg-gena-dark/40 p-4 text-sm text-slate-200",
                    currentSectionIndex !== 2 && "hidden"
                  )}
                >
                  <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <p className="text-emerald-200">Card status</p>
                    <p className="text-xs">Click “Generate card” to refresh the preview with your latest wording.</p>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Sparkles size={18} className="text-amber-300" />
                      <span>Glow gradients + Amharic typography</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleGenerate}
                        type="button"
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:shadow-rose-400/40"
                      >
                        <Gift size={16} /> Generate card
                      </button>
                      <p className="text-xs text-slate-400">{status || "Ready to craft"}</p>
                    </div>
                  </div>

                  <div
                    ref={shareSectionRef}
                    className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-200">Share</h3>
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-300"
                      >
                        <Share2 size={16} />
                        Native share
                      </button>
                    </div>
                   {/* <div className="grid grid-cols-2 gap-2">
                      {shareTargets.map((target) => (
                        <button
                          key={target.label}
                          type="button"
                          onClick={() => handleShare(target.url(shareEncoded))}
                          className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-emerald-400"
                        >
                          <span className="flex items-center gap-2">
                            <target.icon size={18} className="text-emerald-300" />
                            {target.label}
                          </span>
                          <Share2 size={18} className="text-emerald-200" />
                        </button>
                      ))}
                    </div> */}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleCopy}
                        type="button"
                        className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-400/30 via-transparent to-emerald-300/40 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Clipboard size={16} /> Copy blessing
                      </button>
                      {/*<button
                        onClick={handleCopyLink}
                        type="button"
                        className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-gradient-to-r from-amber-300/30 via-transparent to-amber-200/40 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <LinkIcon size={16} /> Copy link
                      </button> */}
                      <p className="text-xs text-slate-400">{status || "Ready to share or download"}</p>
                    </div>
                  </div>

                  <div
                    ref={downloadSectionRef}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <button
                      onClick={handleDownload}
                      type="button"
                      disabled={isDownloading}
                      className={clsx(
                        "flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:shadow-emerald-400/60",
                        isDownloading && "opacity-60"
                      )}
                    >
                      <Download size={16} />
                      {isDownloading ? "Preparing…" : "Download card"}
                    </button>
                    <p className="text-xs text-slate-400">PNG will capture the current styling.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm text-slate-200">
                <div className="text-xs text-slate-400">
                  Section {currentSectionIndex + 1} of {formSections.length}: <span className="font-semibold text-slate-100">{formSections[currentSectionIndex]?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevSection}
                    disabled={currentSectionIndex === 0}
                    className={clsx(
                      "rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold",
                      currentSectionIndex === 0 ? "opacity-50" : "hover:border-emerald-300"
                    )}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSection}
                    disabled={currentSectionIndex === formSections.length - 1}
                    className={clsx(
                      "rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-50",
                      currentSectionIndex === formSections.length - 1 ? "opacity-50" : "hover:border-emerald-300 hover:bg-emerald-500/25"
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <div ref={cardWrapRef} className="flex w-full min-w-0 justify-center overflow-visible">
              <div className="flex min-w-0 justify-center">
                <section
                  ref={cardRef}
                  className="relative w-full max-w-[600px] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-gena-dark/90 via-slate-900 to-[#050b1d] p-5 shadow-card-glow card-panel"
                >
                <div className="pointer-events-none absolute inset-0 bg-gena-gradient opacity-70" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-0 hero-grid-lines" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-0 card-flag-sheen" aria-hidden="true" />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.6em] text-slate-300"> </span>
                    <Badge variant="outline">2018</Badge>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="font-display text-5xl leading-tight text-emerald-100 drop-shadow-[0_15px_25px_rgba(0,0,0,0.35)] md:text-6xl">መልካም ገና</p>
                    <p className="text-sm uppercase tracking-[0.4em] text-amber-200/80">እንኳን ለብርሃነ ልደቱ አደረሳችሁ</p>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur card-border">
                    <div className="flex items-center gap-2 text-amber-200">
                      <p className="text-xs uppercase tracking-[0.35em]">{previewVerseText || "Nativity verse"}</p>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <span className="rounded-full bg-gradient-to-r from-amber-300 to-rose-300 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.28em] text-slate-900 shadow-md">
                        {previewVerseRef || "Luke 2:10-11"}
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">ለ {previewRecipient || fallbackRecipient}</p>
                    <p className="text-sm leading-relaxed text-slate-200">{previewMessage}</p>
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                      {imageSource ? (
                        <img
                          src={imageSource}
                          loading="lazy"
                          alt="Card imagery"
                          className="w-full object-cover"
                          style={{ height: `${imageHeight}px` }}
                        />
                      ) : (
                        <div
                          className="flex w-full items-center justify-center text-xs uppercase tracking-[0.25em] text-slate-500"
                          style={{ height: `${imageHeight}px` }}
                        >
                          Add a photo to display here
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-end text-right text-xs text-slate-300">
                    <p>Crafted for {previewRecipient || "your crew"} · መልካም ገና!</p>
                  </div>
                </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
