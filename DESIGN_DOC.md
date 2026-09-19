# French Vocab Trainer — Design Document
**Phase 1: Anki Module**
Source content: *French NCLC7 Complete 43-Week Plan* (301 daily sessions)

---

## 1. Scope of this phase

This doc covers **only the Anki vocabulary module**. The plan has five daily
components total (Anki, Grammar book, Kwiziq, TV5MONDE, Writing). We are
building Anki first as a standalone, working module. The other four will be
added later as separate sections inside the same app — this doc's data model
and storage approach are written so those can slot in without a rebuild.

---

## 2. Core principles (from your requirements)

1. **Strictly sequential, gated progress.** The app never shows Day N+1's new
   words until Day N has been fully completed. Missing a day does not skip
   it or bury it — the app just waits for you.
2. **Two review pools, one session.** Each session = today's new words +
   a review pool pulled from every previously *completed* day, weighted
   toward words you've flagged as hard.
3. **Manual pacing.** Nothing auto-advances. You control every step.
4. **Streak tracking**, separate from curriculum position — see §5.2 for why
   these are two different counters.
5. **Free, local TTS** — no API keys, no backend cost.
6. **Dark blue visual theme.**

---

## 3. Data model

### 3.1 Static content (pre-loaded, doesn't change)
Extracted from the plan, one record per day:

```
Day {
  day_number: 1–301
  week_number: 1–43
  cards: [
    { card_id, french, english }
  ]
}
```

Example (Day 1):
```
{ day_number: 1, week_number: 1, cards: [
    { card_id: "d1c1", french: "bonjour", english: "hello" },
    { card_id: "d1c2", french: "je m'appelle", english: "my name is" },
    ... (rest of Day 1's exact cards from the plan)
  ]
}
```
All 301 days' worth of cards will be pre-loaded into the app at build time —
no manual entry needed, since these already exist in the plan.

### 3.2 User progress state (persisted, changes over time)

```
Progress {
  current_day: int              // the day the user is actively working on
  completed_days: [int]         // fully finished day_numbers
  last_activity_date: date      // for streak calculation
  streak_count: int
  longest_streak: int
}
```

### 3.3 Hard-word list (persisted)

```
HardWords: [card_id]           // toggled on/off per card, any day
```

### 3.4 Per-card review stats (persisted, powers weighting)

```
CardStats {
  card_id: {
    times_seen: int
    times_marked_hard_total: int   // historical, even if currently un-flagged
    last_seen_day: int             // which session it last appeared in
  }
}
```

This is what lets "weighted toward words I've gotten wrong before" actually
work — hard-flagged words get pulled into the review pool more often than
non-flagged ones.

---

## 4. Session flow

### 4.1 What happens when you open the app
- App loads `Progress.current_day`.
- If that day is already in `completed_days` → shouldn't happen (day advances
  automatically on completion — see 4.4) but is handled safely regardless.
- If not completed → app assembles today's session:
  - **New words**: all cards for `current_day`.
  - **Review words**: a weighted-random pull from all cards belonging to
    `completed_days`, biased toward `HardWords`.
    - **Decided:** the review count ramps up over the course of the plan —
      small early on (when there isn't much to review yet anyway), scaling
      up to 30–40 by later weeks. Concrete rule:

      ```
      target = round(5 + (35 / 300) * completed_days.length)
      review_count = min(target, size of available review pool)
      ```

      At day 1 this gives a target of ~5 (and in practice even less, since
      the available pool is tiny that early). By the final stretch of the
      plan (around day 280–300) it reaches ~38–40. It's a straight linear
      ramp from 5 to 40 across the 301 days, always capped by whatever's
      actually available so it never tries to pull more review words than
      exist. This is a tunable constant, not hardcoded logic — easy to
      adjust the start/end numbers later if 5→40 feels off once you're
      actually using it.

### 4.2 Card interaction (per word)

**Revised (superseding the original two-pass design):** each word now
appears **once** per session, not twice back-to-back in both directions.
Direction is assigned per word when the session is built:

- **New words (today's day)**: always **French → English**. You see the
  French word/phrase and produce the English meaning. Single direction,
  no reverse pass — the reasoning being that on day one of a word, you're
  still building recognition, not yet ready to be tested on production
  from English.
- **Review words (from any earlier completed day)**: direction is chosen
  **at random per card** — either English → French or French → English —
  decided once when the session is built, not re-randomized if you
  navigate back and forth over it.

Interaction, regardless of direction:
1. Prompt shown (French for FE-direction cards, English for EF-direction
   cards).
2. You think of / say the translation out loud.
3. Tap **"Show answer"** → reveals the translation. This button only
   reveals — it does not advance. Once revealed, the button shows as
   answered and no longer does anything until the next card.
4. Use the **arrow controls either side of the card** to move on:
   - **Right arrow** → advances to the next word in the session (works
     whether or not you've revealed the current one — it's a navigation
     control, not gated on reveal). On the last word of the session, the
     right arrow becomes a checkmark and completes the day instead.
   - **Left arrow** → goes back to the previous word, so you can revisit
     it. Disabled on the first word of the session. Navigating with either
     arrow resets the reveal state for whichever card you land on.

The word itself sits centered in the card (not pushed toward the top),
and the revealed answer appears as part of that same centered block rather
than in a separate lower region — so the card doesn't visually shift focus
between the prompt-only and revealed states.

### 4.3 The hard-word button
- Small flag/star icon in a corner of every card.
- Tap once → word added to `HardWords`, icon fills in as visual confirmation.
- Tap again → removed from `HardWords`, icon reverts.
- No confirmation dialog — it's meant to be a fast, low-friction tag.

### 4.4 Completing a session
- Session is complete when every word (new + review) has gone through both
  passes.
- On completion:
  - `current_day` added to `completed_days`.
  - `current_day` increments by 1 (this is what unlocks tomorrow's new
    words — but only once you actually open a fresh session on a new day;
    same-day re-opens just resume/redo).
  - Streak logic runs (§5.2).
  - A short completion screen: day X of 301 done, Y days remaining, current
    streak.

### 4.5 Missed-day handling
- If you don't open the app for a day (or several), nothing changes on the
  curriculum side — `current_day` stays exactly where you left it. There is
  no "catching up" mechanic to design because there's nothing to catch up
  on: the next session you do is still Day N, whatever N was.
- What *does* change is your streak (see below).

---

## 5. Progress & streak tracking

### 5.1 Curriculum position ("days done / days left")
- Simple: `completed_days.length` out of 301, and `301 - completed_days.length`
  remaining. This only moves forward when a full session is completed —
  entirely decoupled from the calendar.

### 5.2 Streak (separate counter, calendar-based)
- A streak counts **consecutive real-world days** on which you completed at
  least one session.
- Device date is used only for this — to detect "did I do this today?" and
  "did I miss yesterday?" It does **not** unlock or skip curriculum content;
  that's governed purely by §4.4.
- If a day passes with no completed session, `streak_count` resets to 0
  (`longest_streak` is preserved separately as a personal-best).
- **Decided:** catching up on multiple curriculum days within one real-world
  day still only counts as **+1** streak. Streak measures "did I show up
  today," not how much content got finished — so a five-day catch-up
  session moves `completed_days` forward by five, but `streak_count` only
  goes up by one.

---

## 6. Text-to-speech

- Uses the browser's built-in **Web Speech API** (`speechSynthesis`) with a
  French voice (`fr-FR`) — completely free, no account, no API key, works
  offline once the page is loaded.
- Trade-off to be aware of: voice quality/availability depends on the
  user's browser and OS (Chrome/Edge on desktop generally have solid French
  voices; mobile browser support varies). Since this is the free option,
  that's the accepted trade-off — no cost, slightly inconsistent voice
  quality across devices.
- TTS auto-plays once per reveal; a small speaker icon also lets you
  replay it on demand.

### 6.1 Planned upgrade: Google Cloud Text-to-Speech (not yet built)
- **Decision, parked for later:** once the app moves to independent
  deployment (§8.2), switch the TTS engine from the browser's built-in
  voice to **Google Cloud Text-to-Speech** (WaveNet/Neural2 French voices)
  for noticeably better, more natural accent quality — relevant since this
  is exam prep, not just casual practice.
- **Why this waits for deployment, not something we can do inside Claude
  now:** it requires an API key, and a key can't safely sit in code that
  runs in the browser — it would be visible to anyone who opened dev tools.
  It needs a small backend to hold the key and proxy the request, which is
  exactly the kind of thing the independent-deployment phase already
  involves.
- **Cost:** genuinely free at this app's scale — Google's free tier is
  1 million characters/month, and even a full 40-review-word day for months
  wouldn't approach a small fraction of that. This isn't a "free trial that
  runs out" situation.
- **Reminder handling:** I don't currently have persistent memory of this
  conversation once it ends, so I won't automatically bring this up in a
  future chat unless you have Claude's memory feature turned on (Settings →
  enable "Search and reference past chats" / memory). With that on, this
  decision — and the fact that it's written into this doc — should
  naturally resurface when we get back to deployment. Either way, this
  section is the actual record of the plan: whenever we're back working on
  this project, pointing me at this doc (or just saying "check the TTS
  upgrade note") will pick it back up immediately.

---

## 7. Visual design — dark blue theme

Proposed palette (to be refined once we're building, but this is the
direction):

| Role | Color | Hex |
|---|---|---|
| App background | Deep navy | `#0B1220` |
| Card surface | Slightly lighter navy | `#131C2E` |
| Card border / dividers | Muted steel blue | `#25314A` |
| Primary accent (buttons, streak flame, progress bar) | Bright azure | `#3B82F6` |
| Secondary accent (hard-word flag, active state) | Soft amber (deliberate contrast, not blue, so "hard" is easy to spot at a glance) | `#F59E0B` |
| Primary text | Off-white | `#E8EDF6` |
| Secondary/muted text | Slate gray-blue | `#8291AB` |
| Success (session complete, streak up) | Teal-green | `#22C55E` |

Typography and layout: large, centered word on each card (this is the focal
point), generous white space, minimal chrome — the card itself should feel
like the whole screen, similar to Quizlet/Anki's mobile card view rather
than a dashboard-heavy layout.

---

## 8. Storage approach

### 8.1 Phase 1 (building inside Claude)
- Built as a React web artifact using the **persistent artifact storage API**
  (`window.storage`), scoped as **personal** (not shared) data, since this is
  single-user progress.
- Keys grouped to minimize calls, roughly:
  - `progress` → Progress object (§3.2)
  - `hard-words` → HardWords array (§3.3)
  - `card-stats` → CardStats object (§3.4)
- Static content (§3.1) ships baked into the app code, not fetched from
  storage, since it never changes.
- **Cross-device sync note:** `window.storage` is tied to your Claude
  account, not to a specific device or browser. So opening this artifact
  from your phone and your laptop (same account) already gives you sync at
  no extra cost or setup — this is a free side-effect of building it inside
  Claude first, not something we have to engineer separately in Phase 1.

### 8.2 Future — if/when deployed outside Claude
- **Decided (for later):** since cross-device sync matters to you, an
  independent deployment cannot rely on plain browser storage
  (localStorage/IndexedDB), since that's tied to one device/browser and
  wouldn't follow you between phone and laptop.
- Plan for that stage: a small **free-tier cloud database** (Supabase is
  the natural fit — free tier comfortably covers this app's tiny data
  volume) so progress, streaks, and hard-word flags sync the same way they
  already do inside Claude.
- This swap only touches the storage layer (§3) — the data model, session
  flow, and UI stay the same regardless of which phase we're in.
- Cost note: expected to remain free indefinitely at this app's scale (a
  few KB of data for a single user) — this isn't a "free now, paid later"
  situation, just "free now, free later too" unless the scope changes
  significantly (e.g. turning it into a multi-user product).

---

## 9. Roadmap — future modules

The app will eventually have five daily sections, added one at a time:

1. ✅ Anki (Phase 1)
2. ✅ Grammar book (Phase 2) — daily task text, sequential gating, its own
   streak, arrow navigation between days. Book/chapter/topic reference data
   exists in the underlying dataset (from the plan's own crosswalk) but is
   currently hidden from the card per your instruction; can be re-surfaced
   later.
3. Kwiziq — daily links section (spec TBD by you)
4. TV5MONDE — daily links section (spec TBD by you)
5. Writing — daily section (spec TBD by you)

The `Day` data structure (§3.1) is deliberately shaped so each new module can
attach its own array to the same day record (e.g. `Day.grammar_tasks`,
`Day.kwiziq_links`) rather than requiring a redesign. The gating logic
(§4.4/4.5) will likely need to expand later to "day complete" meaning *all*
sections done, not just Anki — but that's a decision for when we get there.

**Also parked for later, alongside independent deployment:** upgrade TTS
from the free browser voice to Google Cloud Text-to-Speech — see §6.1 for
the full reasoning. Flagging it here too since this is the section most
likely to get checked when picking the project back up.

### 9.1 Planned feature: per-day chapter-excerpt PDF button (Grammar module)

- **What it is:** a button under each day's grammar task that opens a small
  PDF containing just that day's specific chapter page(s) from the right
  Grammaire Progressive volume — instead of the person digging through the
  full 176–284 page book themselves.
- **Why this waits for independent deployment, not something buildable
  inside Claude now:** the app is a single self-contained file that runs
  entirely in the browser. It has no way to run PDF-page-extraction code
  itself, and the three source books are too large (~118 MB combined) to
  embed inside the app for on-demand cutting. A real "generate this now"
  button needs a backend to do the actual extraction and hand back a file
  — which is exactly the kind of thing the independent-deployment phase
  (§8.2) already involves.
- **What's already in place for when we build it:** exact chapter-to-page
  mappings for all three books (used to build the Grammar module's
  reference data), and exact chapter numbers per day from the plan's own
  crosswalk. The hard part — knowing *which* pages each day needs — is
  already solved; what's missing is just the serving mechanism.
- **Interim option, available anytime without waiting for deployment:**
  ask in chat for a specific day's (or chapter's) pages, and a small PDF
  excerpt can be produced and shared immediately — this doesn't require
  the in-app button at all, just doesn't happen automatically.

---

## 9.2 Deployment — complete

Started once TTS upgrade and the chapter-PDF button were both confirmed as
wanted at deployment. Platform: **Supabase** (database + backend functions
in one place) + **Vercel** for the frontend. Live at
https://french-learning-rouge.vercel.app/ (auto-deploys on push to `main`
of github.com/Kamran-nust/FrenchLearning; Vercel root directory is
`frontend`).

**Sequence:**
1. Pick platform — done (Supabase + Vercel).
2. External accounts (Supabase project, Google Cloud TTS service account,
   3 grammar PDFs in Supabase Storage, Gemini API key) — **done**.
3. Database schema + auth — **done**, see below.
4. Three backend functions (TTS proxy, PDF extractor, writing feedback) —
   **done and tested**, see below.
5. Frontend storage/TTS/PDF-button touchpoints — **done**, via
   `window.storage` / `speechSynthesis` shims (`frontend/src/lib/`) so the
   original app logic stayed unmodified.
6. Deploy frontend to GitHub → Vercel — **done**.
7. End-to-end test on the live URL (sign-in, saved progress, TTS audio,
   grammar PDF viewer, writing feedback, session persistence) — **done,
   all passing**.

**Post-launch cleanup:** `App.jsx` was split from a 2,855-line single file
(inherited from the Claude.ai artifact) into `data/`, `modules/`,
`screens/`, `shared/` and `lib/` folders; it is now a 74-line router.

**Database (`supabase/migrations/0001_app_state.sql`):** one generic
`app_state(user_id, key, value jsonb)` table with row-level security, so
each person can only read/write their own rows. This deliberately mirrors
the app's existing `window.storage.get/set(key, value)` shape — the same
key names (`progress`, `hard-words`, `grammar-progress`, `writing-entries`,
etc.) carry over, so step 5 only needs to swap *how* those calls are made,
not redesign what's stored.

**Backend function 1 — `text-to-speech`:** takes `{ text }`, calls Google
Cloud TTS (`fr-FR-Neural2-C` voice), returns base64 MP3 audio.
**Updated from the original plan**: Google's console steered this specific
project toward a **service account** rather than a plain API key for this
API, so the function authenticates via a service-account JSON key
(`GOOGLE_SERVICE_ACCOUNT_JSON` as a Supabase secret) using
`google-auth-library`'s token exchange, then calls the TTS REST endpoint
with a Bearer token instead of `?key=`. Functionally equivalent, just a
different (Google-recommended) auth method — no change to cost, voice
quality, or anything else already decided.

**Backend function 2 — `grammar-pages`:** takes `{ book, chapters }` —
exactly what the Grammar module's data already carries per day. Looks up
the real page range from `book_toc.ts` (derived from each book's actual
table of contents, the same data built earlier for the Grammar module),
downloads the matching source PDF from Supabase Storage, extracts just
those pages with `pdf-lib`, and returns a small standalone PDF.
**Verified working**: tested locally against the real A1-A2 book —
extracting chapter 1 correctly pulled pages 8–9, confirmed by rendering the
result and visually matching it to the table of contents.

**Backend function 3 — `writing-feedback`:** takes `{ task, draft }` from
the Writing module. Found during the post-deployment code-quality pass:
the original artifact's "Get feedback" button called
`api.anthropic.com` directly from the browser with no API key — worked
inside the Claude.ai artifact sandbox (which proxies that call
transparently) but was silently dead in the real deployed app. Fixed with
the same proxy pattern as `text-to-speech`: the prompt is built
server-side and the function calls an LLM with a server-held key, so the
key never reaches the browser. **Chose Gemini 3.6 Flash over Claude** for
this specific feature — free tier comfortably covers this app's usage (a
couple of requests/day, far under Gemini's free ~250–500/day limit) at
comparable quality for a well-scoped grammar-feedback task, versus
Claude's ~$1.50–2 estimated total cost for the whole 301-day plan (still
cheap, but not literally free). Requires a Supabase secret
`GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).
**Verified working** end-to-end live in the browser: real French input
with a missing accent produced accurate, correctly-formatted feedback.

One fix made during this step: the last chapter of each book originally had
its page range extending all the way to the book's back matter (index,
annexes, etc.) rather than a sensible chapter-sized span — corrected to use
each book's typical chapter length as the estimate for its final chapter.

Also fixed post-launch: `grammar-pages` originally merged every requested
chapter into one `min(startPage)..max(endPage)` span, which silently pulled
in any chapters *in between* two non-adjacent requested chapters (e.g. Day 1
asks for Ch. 1 and Ch. 4, but got Ch. 1 through Ch. 4 inclusive — 10 pages
instead of the correct 4). Now each requested chapter contributes only its
own pages, unioned together, so non-adjacent chapters correctly skip
whatever's between them.

### 9.3 Authentication

**Current: email + password.** Started with Supabase magic-link (passwordless
email OTP), but that requires a round-trip email on *every* sign-in, and hit
Supabase's free-tier SMTP rate limit twice within one testing session — bad
fit for a single-user app that just needs to stay signed in. Switched to
email + password: one email at account creation (confirmation only), then
sign-in is instant with no email dependency. Session persists in
`localStorage` afterward regardless of which method is used, so day-to-day
this rarely even shows up.

**Usernames and sign-in options (added post-launch).**
- Signup asks for a username (3–20 chars: letters, digits, underscore),
  stored in a `profiles` table (`0002_profiles.sql`): case-insensitive
  unique, RLS read-own, written only by an `auth.users` trigger, so it
  can't be changed or claimed from the browser. A `username_available()`
  RPC lets the form say "taken" before the account is created.
- Sign-in has an Email / Username radio. Email uses Supabase directly.
  Username goes through the public `sign-in` Edge Function, which resolves
  the username to an email server-side, signs in, and returns the session;
  unknown username and wrong password give the same error, so emails and
  account existence aren't leaked. Caveat: those sign-ins originate from
  the function's IP, so Supabase's per-IP auth rate limits are shared
  across everyone signing in by username.
- A slim top strip (`SessionBar`, mounted in `AuthGate`) shows who is
  signed in (username, else email) with a Log out button.
- Accounts created before usernames existed have no profile until one is
  inserted (see the SQL used for the owner's account).
- The TTS, writing-feedback and grammar-pages functions now require a
  signed-in user's token (`_shared/auth.ts`); the public anon key alone
  gets a 401, so strangers can't spend the shared Gemini/TTS quota.

**Colour themes (added post-launch).** Four themes - Midnight (the original
dark blue), Paper (white), Lavender and Blush - chosen from a Theme menu in
the top strip. Every colour is a named token (`COLORS.bg`, `COLORS.accent`,
`COLORS.onAccent`, `COLORS.danger`, ...) that resolves to a CSS variable;
each theme in `shared/themes.js` supplies the values, so switching just
changes a `data-theme` attribute and the whole app repaints with no
component changes. Adding a theme means adding one object to `THEMES`. The
choice is saved on the device (applied before first paint, so no flash) and
on the account (`theme` key) so it follows the user across devices. All
text/background pairs in every theme were checked to meet WCAG AA (4.5:1).
Rule for new UI: use tokens from `COLORS`, never hardcoded hex colours.

**Account tiers (added post-launch): free < premium < super.**
- Stored server-side in `user_tiers` (`0003_tiers.sql`): every account gets a
  row (free by default, via trigger; existing accounts were backfilled). There
  are no insert/update/delete policies, so a tier can never be changed from
  the browser - only via the dashboard/SQL, or `set_user_tier()` (super users
  only, and it refuses to remove the last super user).
- Frontend: `shared/tiers.js` (tier order, and the `FEATURES` map of feature ->
  lowest allowed tier), `TierContext.jsx` (`useTier()`), `Gate.jsx`
  (`<Gate feature="x" fallback={...}>`), and a tier label in the top strip.
  Unknown feature names and unreadable tiers fail closed (denied / free).
- UI gating only hides things. Anything that must really be restricted (an
  Edge Function, stored data) must also be enforced server-side, e.g. by
  checking `current_tier()` in the function.
- Assign a tier: `update user_tiers set tier = 'premium' where user_id =
  (select id from auth.users where email = 'someone@example.com');`

**Feature -> tier map.** Grammar chapter PDFs: Premium and Super only
(`FEATURES.grammarPdf`). Free users see a locked note instead of the button;
the `grammar-pages` function also rejects them with a 403 (`requireTier` in
`_shared/auth.ts`, which fails closed to free if the tier can't be read), so
calling it directly doesn't bypass the restriction. AI writing feedback is
available to everyone, with per-tier daily limits (below). Everything else is
available to all tiers. When restricting a new feature: add it to `FEATURES`,
wrap the UI in `<Gate>`, and add `requireTier` to any backend function it uses.

**Admin page (super users only).** A "Admin: manage users" button on the
home screen (`FEATURES.adminPanel = "super"`) opens `screens/AdminScreen.jsx`:
every user with username, email, tier, join date, last sign-in and AI
feedback used in the last 24h, plus search and a tier dropdown per person
(free/premium/super). Your own row is locked, promoting someone to super asks
for confirmation, and a refused change reverts with the reason shown. It is
backed by `admin_list_users()` (migration `0005`) and `set_user_tier()`; both
check for a super user *inside the database*, so hiding the button is not the
only protection, and `set_user_tier` refuses to remove the last super user.
Tier changes apply on the affected user's next page load.

**Direct lesson links for Kwiziq / TV5 (premium and super).** Free users keep
the built-in Google-search links. For premium and super
(`FEATURES.directLessonLinks`), a chip that has a row in the `lesson_links`
table (migration `0006`, keyed by `(module, chip)` = the exact chip text shown)
opens the real lesson page in a new tab instead; chips with no row fall back to
the Google search, so nothing breaks while links are added gradually. The table
is readable only by premium/super (and only `approved` rows) and writable only
by super, enforced by row-level security - so the links are genuinely
premium-only, and editing them needs no code change or deploy. Kwiziq links were
matched from the plan text against Kwiziq's public lesson list (541 lessons):
68 confident matches are live (`approved = true`, covering 49 of 301 days, all
verified to return HTTP 200), and 35 candidates await review
(`supabase/seed/kwiziq_links_review.md`; approve with an SQL `update`). About
two thirds of Kwiziq chips are study instructions ("Mixed kwiz", "Take a
diagnostic", ...) rather than lessons, so they have no page to link to. TV5
uses the same table (`module = 'tv5'`) and is wired up, but has no rows yet;
73 of its 301 days are generic study instructions with no lesson page. Seed
data: `supabase/seed/kwiziq_links.sql` (re-runnable upsert).
Links that are *not* one of the plan's chips (an extra link on a given day)
live in a second table, `lesson_extra_links` (migration `0007`: module, day,
label, url, sort; same access rules), shown as extra rows under that day's
chips for premium/super. Day 1 currently has one (Me/te/nous/vous), and Day 1's
"subject pronouns" chip points at the Tu/Vous lesson
(`supabase/seed/kwiziq_day1_links.sql`).

**AI writing-feedback limits (per tier, rolling 24 hours).** Free: 1,
Premium: 5, Super: unlimited. Limits live in the `tier_limits` table
(`0004_feedback_limits.sql`; NULL = unlimited), so they can be changed with
one SQL update and no deploy, e.g.
`update tier_limits set feedback_per_day = 10 where tier = 'premium';`.
Enforced server-side in the `writing-feedback` function: it reserves a use
atomically (`try_use_feedback`, service-role only, per-user lock so two
simultaneous requests can't both slip under the limit) *before* calling
Gemini, and refunds it if Gemini fails, so a failed AI call never costs the
user an allowance. Over the limit returns 429 with the time the next slot
frees up. Bad input is rejected before anything is reserved. The Writing
screen shows "N of M AI feedbacks left", disables the button with "Next one
available in Xh Ym" at the limit, and says "the AI is busy" (no allowance
used) when Gemini itself is rate-limiting. Note Gemini's free tier caps the
*whole app* at roughly 10 requests/minute across all users; that is a Google
limit separate from these per-user allowances.

**Planned upgrade: OAuth (Google sign-in).** Parked for later, same reasoning
pattern as the TTS/PDF upgrades in §6.1/§9.1 — not something blocking current
use, worth doing when convenient. Would mean registering an OAuth app in
Google Cloud Console (the same project already used for TTS) and adding a
"Sign in with Google" button alongside/instead of the password form via
`supabase.auth.signInWithOAuth`. No changes needed to the data layer — auth
method is orthogonal to how `app_state` rows are scoped (see below).

**Multi-user readiness.** Asked and worth recording: would supporting more
than one person require a heavy rebuild? **No** — the data layer was already
built per-user, not single-user-hardcoded:
- `app_state(user_id, key, value)` is keyed by `user_id` with RLS scoped to
  `auth.uid() = user_id` (§8.2/migration `0001_app_state.sql`) — this was
  already isolating rows per authenticated user, it just happened that only
  one person was using it.
- The frontend's storage/TTS shims (`windowStorage.js`, `ttsShim.js`) install
  using whichever user is currently signed in (`session.user.id`), not a
  fixed ID.
- Static content (days, cards, grammar chapters) is shared/baked into the
  app for everyone — correct either way, since it's the same curriculum.
- The two Edge Functions (`text-to-speech`, `grammar-pages`) are stateless
  and already user-agnostic — no per-user branching needed.

What *would* actually be needed to open this up to more people:
1. A real signup flow (already exists as of the password-auth switch above —
   the sign-in/sign-up toggle in `AuthGate.jsx`).
2. Watching the shared Google Cloud TTS free-tier quota (1M characters/month
   per *project*, not per user) — fine at small scale, would need attention
   if usage grew substantially.
3. Product-level things out of scope for this doc if it ever became more
   than a personal tool (terms of service, support, etc.) — not a code
   change.

In short: the hard part (per-user data isolation) is already done as a
side effect of using Supabase Auth + RLS from the start, rather than
something that needs retrofitting.

---

## 10. Decisions log

All three open questions from the earlier draft are now resolved:

1. **Review pool size:** linear ramp, ~5 words early on up to 30–40 by the
   later weeks, always capped by what's actually available (§4.1).
2. **Pass ordering:** per-word — each word does Pass A (EN→FR) then Pass B
   (FR→EN) immediately, before moving to the next word (§4.2).
3. **Streak on catch-up:** always +1 per real-world day, regardless of how
   many curriculum days get completed in that sitting (§5.2).

Design is locked in for Phase 1 (Anki module). Ready to build whenever
you give the heads-up.

**Day plan PDF download (premium and super).** At the bottom of the "Jump to a
day" screen, premium and super users get a "Download Day N plan (PDF)" button
(`FEATURES.dayPlanPdf`; free users see a locked note). The PDF is built in the
browser with jsPDF, loaded only on demand: an A4 print-friendly page with the
day's Anki cards (French/English table), grammar-book task, Kwiziq and TV5
lessons (plain text, no links), and writing task, with a
tick box per section. Limit: premium 1 per rolling 24 hours, super unlimited,
free 0 - the numbers live in the `pdf_limits` table (`0008_pdf_download_limits.sql`;
NULL = unlimited), e.g. `update pdf_limits set downloads_per_day = 2 where tier = 'premium';`.
Enforced in the database, not the browser: the page first calls
`claim_pdf_download(day)` (atomic, per-user lock) and only builds the PDF if it
returns a ticket. Any download counts, including re-downloading the same day.
If PDF creation fails, `refund_pdf_download` hands the download back (only the
caller's own, within 2 minutes). Premium users see a plain button; only after
using it does it grey out with "Available again in Xh Ym".

### 9.4 Engineering practices (added after the best-practices review)

- **Tests.** `cd frontend && npm test` runs 67 unit/component tests (vitest):
  tier rules, theme definitions and contrast, day/streak logic, plan-data
  integrity (301 days per module, week numbers, unique card ids, levels cover
  all days), the AI-feedback error mapping, PDF text safety, the error
  boundary, and the "failed load must never be overwritten" behaviour of the
  modules. Database limits (AI feedback + PDF downloads) are tested by
  `supabase/tests/limits_test.sql` (run with
  `npx supabase db query --linked -f supabase/tests/limits_test.sql`; it always
  rolls back and ends with "ALL DATABASE TESTS PASSED" when healthy).
- **Lint / format / CI.** ESLint (`npm run lint`) and Prettier
  (`npm run format`, `npm run format:check`); `.github/workflows/ci.yml` runs
  lint, format check, tests and a production build on every push. Remaining
  lint warnings are hook-dependency notes, not errors.
- **Saved-progress safety.** Reading saved progress distinguishes "nothing saved
  yet" from "couldn't read it" (`readSaved` in `shared/storage.js`). If a read
  fails, the module shows a notice and switches saving off for that session, so
  a network blip can never overwrite real progress with an empty Day 1.
- **Error boundaries.** `ErrorBoundary.jsx` wraps sign-in and the app; a
  crashing screen shows "Something went wrong" (Try again / Reload) and the top
  strip stays usable.
- **Sign-in hardening.** The `sign-in` function records failures
  (`signin_failures`, migration `0009`) and refuses further attempts with 429
  after 5 failures for one name from one place, or 30 from one place, within 15
  minutes; a correct sign-in clears the count. Functions no longer return
  internal error detail to the browser (it is logged server-side instead), and
  malformed requests get 400.
- **Module code.** Kwiziq and TV5MONDE are deliberately separate modules, each
  its own file and screen (`modules/KwiziqModule.jsx`, `modules/Tv5Module.jsx`),
  even though they are similar - they are different sections of the app and
  are expected to diverge. Snapshot tests
  (`__tests__/lessonModules.snapshot.test.jsx`) pin down the exact rendered
  output of both, so an unintended visual change fails the tests. The "complete
  the day + streak" rule and the fresh-progress shape live in `shared/progress.js`
  (unit-tested) and are used by the Grammar and Writing modules. Kwiziq, TV5 and
  Anki keep their own copies.

### 9.5 Native mobile apps (Android and iPhone)

Two separate native rewrites live next to the web app, using the same Supabase backend (same accounts, tiers, saved progress, sign-in function): `android/` (Kotlin + Jetpack Compose) and `ios/` (Swift + SwiftUI, project generated by XcodeGen). The web app in `frontend/` is not touched by them. Phase 1 (done): email/username sign-in, sign-up, log out, tier chip, four themes, Home with "Day N complete" progress, and a read-only day viewer for all five sections. Not yet built: Anki sessions, mark-day-complete + streaks, Writing + AI feedback, Grammar PDFs, direct lesson links, day-plan PDF, admin page, text-to-speech. Plan data is exported from `frontend/src/data` by `node tools/export-plan-data.mjs`. The Android project compiles and its unit tests pass; the iPhone project has not been compiled (it needs a Mac with Xcode). See `android/README.md` and `ios/README.md`.
