# French NCLC 7 Study App — Handoff to Claude Code

This project has been built and designed so far in a Claude.ai chat
conversation (see `DESIGN_DOC.md` for the full history and reasoning).
This file briefs Claude Code on exactly where things stand so no prior
context needs to be re-explained.

## What this app is

A personal 301-day French exam-prep companion (Anki flashcards, Grammar
book tracker, Kwiziq/TV5MONDE link sections, Writing with AI feedback),
currently running entirely inside a Claude.ai artifact using Claude's
built-in `window.storage` API and browser TTS. Full detail in
`DESIGN_DOC.md`.

## Why we're deploying independently

Three things need a real backend that a self-contained artifact can't
provide:
1. **Cross-device sync** (currently works only via `window.storage`, tied
   to the Claude environment).
2. **Better TTS** — upgrading from the browser's free voice to Google
   Cloud Text-to-Speech (Neural2), for accent quality during exam prep.
3. **Grammar chapter-excerpt PDFs** — a button under each day's grammar
   task that serves just that day's relevant pages from the right
   Grammaire Progressive volume, instead of the person searching a 200+
   page book themselves.

## Status: what's already done

- [x] Platform chosen: **Supabase** (Postgres + Edge Functions) for the
      backend, a static host (Vercel or Netlify, undecided which) for the
      frontend.
- [x] Supabase project created.
- [x] Google Cloud project created, billing enabled, Text-to-Speech API
      enabled.
- [x] Google service account created (a plain API key wasn't offered by
      this Google Cloud project's console — it steered toward a service
      account instead, which is actually Google's preferred method
      anyway). A JSON key file has been downloaded and is in the person's
      possession, not yet provided to me.
- [x] Database schema written: `supabase/migrations/0001_app_state.sql`
      — one generic `app_state(user_id, key, value jsonb)` table with
      row-level security, deliberately mirroring the app's existing
      `window.storage.get/set(key, value)` calls so the frontend rewrite
      stays minimal (same key names: `progress`, `hard-words`,
      `card-stats`, `grammar-progress`, `kwiziq-progress`, `tv5-progress`,
      `writing-progress`, `writing-entries`).
- [x] Backend function `supabase/functions/text-to-speech/index.ts` —
      written and reviewed, NOT yet deployed or live-tested (can't test
      without the real service account key). Authenticates via
      `GOOGLE_SERVICE_ACCOUNT_JSON` (a Supabase secret, the full contents
      of the downloaded key file) using `google-auth-library`, calls
      Google TTS with voice `fr-FR-Neural2-C`, returns base64 MP3.
- [x] Backend function `supabase/functions/grammar-pages/index.ts` —
      written AND locally tested against the real book PDFs (verified by
      actually extracting Chapter 1 from the A1-A2 book and visually
      confirming the correct pages came back). Takes `{ book, chapters }`,
      looks up page ranges from `book_toc.ts` (derived from each book's
      real table of contents), downloads the matching PDF from Supabase
      Storage bucket `grammar-books`, extracts the pages with `pdf-lib`,
      returns a small standalone PDF.
- [x] Three grammar book PDFs uploaded to the `grammar-books` Supabase
      Storage bucket, named `a1-a2.pdf`, `a2-b1.pdf`, `b1-b2.pdf` exactly
      (matching what `book_toc.ts` expects).
      **Important**: these are re-compressed versions of the person's
      original books (rendered to JPEG at 130 DPI / quality 72) because
      the original OCR'd/searchable versions were too large for
      Supabase's free-tier 50MB per-file limit (one was 116MB). Page
      counts are exactly preserved (176/284/211) so `book_toc.ts`'s page
      numbers remain valid, but these copies have **no searchable text
      layer** — that's fine for this use case (pages are only ever
      displayed for reading, never searched), just worth knowing if the
      books ever need replacing.

## Credentials collected so far

- **Supabase Project URL**: `https://lwzqtoedehfskpvjlslw.supabase.co`
- **Supabase Publishable (anon) key**:
  `sb_publishable_l-6mIblyEKNA_bRWTgy2pg_9Xt-bZNi`
  (Both of these are safe to use directly in frontend code — that's what
  they're for.)

## Credentials NOT yet collected (still with the person, correctly kept out of chat)

- **Supabase service_role key** — needed for the Supabase CLI / dashboard
  when setting secrets or doing admin operations. Get it from
  Project Settings → API Keys → Secret keys.
- **Google service account JSON key file** — the full downloaded file
  needs to be set as a Supabase secret named `GOOGLE_SERVICE_ACCOUNT_JSON`
  (paste the entire file's JSON content as the secret's value).

## What's NOT done yet — the actual remaining work

1. **Install and link the Supabase CLI** to the existing project (URL
   above), run the migration in `supabase/migrations/` against the live
   database.
2. **Set secrets** on the Supabase project: `GOOGLE_SERVICE_ACCOUNT_JSON`
   (from the person's downloaded key file).
3. **Deploy both Edge Functions** (`text-to-speech`, `grammar-pages`) and
   do a real end-to-end test of each — the grammar-pages logic was only
   tested locally with plain Node + pdf-lib, not yet as a deployed
   Supabase function; the text-to-speech function hasn't been tested at
   all yet since it needed the real service account key.
4. **Add lightweight auth** (Supabase's email magic-link auth is the
   simplest fit) so the same person's data syncs across devices — the
   `app_state` table's row-level security already assumes `auth.uid()`
   exists per request.
5. **Rewrite the frontend's three touchpoints** in `frontend/App.jsx`:
   - Replace every `window.storage.get/set` call with calls to Supabase
     (same key names, so this is mostly a drop-in swap of the `persist()`
     /load functions in each module).
   - Replace the Web Speech API calls (`speechSynthesis`) with a fetch to
     the deployed `text-to-speech` function, playing back the returned
     base64 MP3.
   - Add the actual "get chapter pages" button in the Grammar module,
     calling the deployed `grammar-pages` function with that day's
     `{ book, chapters }` (already present in `GRAMMAR_DAYS` per day) and
     opening/downloading the returned PDF.
6. **Push to GitHub**, connect the repo to Vercel or Netlify (undecided
   which — either is fine, whichever Claude Code / the person prefers),
   deploy.
7. **End-to-end test**: sync across two devices/browsers, TTS playback,
   the grammar PDF button, and confirm none of the existing gating/streak
   logic broke in the storage-layer swap.

## Things to preserve carefully during the frontend rewrite

- All existing UX behavior (gating, streaks, hard-word weighting, the
  arrow-navigation pattern, Level/Day browsing, the Anki practice-session
  mechanic) should carry over unchanged — only *how* data is persisted and
  *how* audio/PDFs are fetched should change, not the app's logic or feel.
- `DESIGN_DOC.md` §8.2, §6.1, and §9.1–9.2 have the full reasoning behind
  each of these three features if anything is unclear.
