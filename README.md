# Ethiopian Gena Christmas Card

Vite + React + TypeScript + Tailwind UI for crafting, sharing, and downloading a glowing Ethiopian Gena card with Amharic support and Gemini-generated blessings/verses.

## Run it

```bash
npm install
npm run dev -- --host
# build & preview
npm run build
npm run preview
```

## Configure Gemini

- Create `.env` with `VITE_GEMINI_API_KEY=<your-key>`.
- Uses `@google/genai` with `gemini-2.5-flash-lite` for blessings and nativity verses.
- Fallback behavior: if Gemini fails (network, quota, or error) the app falls back to cached/default blessings and verses and surfaces an error/notice in the UI. If an alternate AI provider or local defaults are configured, those will be used instead.

## Key features

- Stepper form: Greeting & verse → Card imagery → Generate/share/download with status chip. See [src/App.tsx](src/App.tsx).
- Gemini assists: Amharic toggle, AI blessing/verse with verse cleanup; manual inputs remain.
- Resilience & updates: the app shows a clear status indicator when it uses a fallback and will surface when generated content has changed (e.g., new model responses or updated blessings).
- Imagery controls: URL, upload, built-in presets from [public/images](public/images), and adjustable image height slider.
- Sharing: WhatsApp, X/Twitter, LinkedIn, Facebook, native share, copy blessing, copy link.
- Download: Transparent PNG via `html-to-image`, forces full desktop card size on export.

## Notes on look & responsiveness

- Card keeps desktop styling (600px max) while filling available width on smaller screens; download always captures the desktop-size card.
- Background/aurora and typography styles live in app CSS; tweak gradients and font stacks to rebrand quickly.

## Extend

- Add/share targets or change copy in [src/App.tsx].
- Swap presets in [public/images](public/images) to ship your own art.
- Connect persistence or analytics endpoints in `handleGenerate`/share flows as needed.

## License & Credits

MIT — feel free to reuse and adapt. Artwork and preset images are in public/images; replace with your own assets as needed.