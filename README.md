# SenpAI (先) — a continuity layer between private lessons and self-study

SenpAI turns a photo of your Japanese lesson notes into structured, spaced-repetition
practice — so what your tutor covers doesn't evaporate before the next lesson.

**Pipeline:** Capture (photo or quick-tap fallback) → Claude vision extraction →
editable confirm/rate screen → per-item drill generation → deterministic SM-2
scheduling → daily practice queue, weighted toward what's still shaky → a
presentable pre-lesson briefing and a lesson history with per-item accuracy trends.

## Stack

- React + Vite, installable as a PWA (manifest + service worker via `vite-plugin-pwa`)
- Supabase for auth (password or magic link) and Postgres storage, with row-level
  security scoping every table to `auth.uid()`
- Claude (Anthropic API) for vision extraction, drill generation, and grading
  production-style answers — called from Vercel serverless functions (`/api/*`),
  never from the client, so the API key is never exposed
- SM-2 spaced repetition implemented as plain, deterministic TypeScript
  (`src/lib/sm2.ts`) — no LLM call ever decides an interval

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
3. In **SQL Editor**, run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates `lessons`, `items`, `review_state`, `review_history`, enables RLS with
   owner-only policies on all four, creates a private `lesson-photos` storage
   bucket with per-user folder policies, and adds a `user_has_password()` helper
   function the Profile page uses to tell magic-link-only accounts from
   password accounts. Safe to re-run on an existing project — it'll just add
   the function.
4. Under **Authentication → Providers**, email/password is on by default. If you want
   magic links to work, make sure **Email** provider is enabled (it is by default) —
   no extra config needed for local/demo use.

## 2. Set up the Anthropic API key

Get a key from [console.anthropic.com](https://console.anthropic.com/). No special
setup beyond that — the serverless functions read it from `ANTHROPIC_API_KEY`.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-5   # optional, this is the default
```

`VITE_`-prefixed vars are exposed to the browser bundle (this is expected — the
anon key is meant to be public and is constrained by RLS). The Anthropic key is
**not** prefixed with `VITE_` and is only ever read server-side, inside `/api/*.ts`.

## 4. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. `npm run dev` runs a full stack, not just the frontend:
a small Vite plugin (`vite-api-plugin.ts`) mounts `api/extract.ts`,
`api/generate-drill.ts`, and `api/grade.ts` as local middleware using the exact
same handler code Vercel will run in production, so there's no need to install the
Vercel CLI or run `vercel dev` for local development.

To install as a PWA: open the app in Chrome/Edge on desktop or Safari/Chrome on
mobile and use "Add to Home Screen" / the install icon in the address bar. Camera
capture uses a native `<input type="file" capture="environment">`, which works
both installed and in-browser without extra permission plumbing.

## 5. Deploy to Vercel

```bash
npm i -g vercel   # if you don't have it
vercel
```

Or connect the repo in the Vercel dashboard. Either way:

- Framework preset: **Vite** (auto-detected)
- Add the same three environment variables from your `.env` in
  **Project Settings → Environment Variables** (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, optionally `ANTHROPIC_MODEL`)
- `vercel.json` includes a SPA rewrite so client-side routes (`/practice`,
  `/history/:id`, etc.) survive a hard refresh, without interfering with `/api/*`

## What's implemented

- Full pipeline: photo capture → Claude vision extraction → editable confirm
  screen with per-item confidence rating → SM-2-scheduled items → daily practice
  queue → weak-point tracking → pre-lesson briefing → lesson history with trends
- Quick-tap MCQ fallback (common grammar patterns + vocab themes across N5–N1)
  for sessions with nothing to photograph — pick a level first, then categories
  within it, in `src/data/jlptCategories.ts`
- All four drill types: vocab cloze (exact-match), guided grammar construction
  (step-by-step, then graded), error-correction (graded), kanji recognition
  flashcards (Anki-style self-grade), each generating from — and caching onto —
  the underlying item
- Kanji auto-split: the extraction prompt requires a separate `kanji` item for
  every distinct kanji character inside a `vocab` item, with its own
  onyomi/kunyomi/meaning/example
- Deterministic SM-2 (`src/lib/sm2.ts`) with a small, explicit table mapping
  grading outcomes (exact-match, Anki-style self-report, or Claude's pass/fail
  judgment) to a fixed quality score — the interval math itself is never touched
  by an LLM call
- `review_history` is append-only, so lesson history shows a real trend per item
  (pass/fail dots + accuracy %), not just current state
- Every `/api/*` route verifies the caller's Supabase session before spending
  Anthropic credits

## What's simplified for the prototype

- **PWA icon**: a single vector (SVG) icon is used for all manifest sizes rather
  than a full png icon set — fine for install prompts on current Chrome/Edge/
  Safari, but a real app store-style asset pipeline would want proper PNGs.
- **Drill caching**: a drill is generated once per item (on first practice) and
  cached in `items.drill_content`. It does not regenerate if you'd want a fresh
  cloze sentence on a later review — this keeps behavior predictable and avoids
  burning API calls, but means a vocab item always drills the same sentence.
- **Grading feedback UI**: Claude's pass/fail + one-line feedback is shown as-is;
  there's no follow-up conversation or partial-credit nuance.
- **Weak-point "days open"**: tracked via a single `shaky_since` timestamp that
  resets on any fail and clears once the item improves — there's no deeper
  history of *why* something stayed shaky, just how long.
- **Pre-lesson briefing** is an in-app, print-friendly screen (not a public,
  no-login URL) — per spec, there's no tutor-facing account or link to manage;
  you hand your own phone to your tutor, or print/export as PDF.
- No offline queueing of practice results — the app expects connectivity for
  Supabase writes and Claude calls.

## Known limitations

- **Handwritten OCR accuracy.** Claude's vision extraction is good at printed
  text and legible handwriting, but real handwritten lesson notes — especially
  fast tutor annotations, cursive-style kana, or cramped margin corrections —
  will sometimes be misread or missed entirely. This is exactly why the confirm/
  edit step is mandatory before anything enters scheduling: treat extraction as
  a first draft, not ground truth.
- Grading of production answers (grammar construction, error correction) is a
  single LLM judgment call per submission — reasonable for a study aid, but not
  infallible, and won't always agree with your tutor's judgment on edge cases.
- No automated tests are included; this is a demo-ready prototype, not a
  hardened production app.
- Out of scope, per spec: kanji stroke-order/writing practice, any tutor-facing
  account/dashboard, voice-memo capture, social/sharing features, and
  AnkiConnect integration.
