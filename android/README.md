# French NCLC 7 - Android app (Kotlin + Jetpack Compose)

A native rewrite of the study app for Android, using the same Supabase backend
as the web app (same accounts, tiers and saved progress).

## Status: foundation (phase 1)

Working in this phase:
- Sign in with email or username, create an account, log out (session remembered on the phone)
- Signed-in strip with tier (Free / Premium / Super)
- Four colour themes (same tokens as the web app)
- Home screen with "Day N complete" progress across all five sections (read from the same saved progress as the web app)
- **Admin page (super users only)**: on Home, "Admin: manage users" lists every user with their tier, join date, last sign-in and recent AI-feedback use; search by email or username, count chips per tier, and change a tier from a menu. Your own row is locked, making someone super asks for confirmation first, and the list only changes once the database accepts the change (otherwise the reason is shown). Both database functions refuse anyone who is not a super user, and the last super user can't be removed.
- **Day-plan PDF download (premium and super)**: at the bottom of the "Jump to a day" screen, "Download Day N plan (PDF)" builds an A4 PDF on the phone (Anki cards, grammar task, Kwiziq and TV5MONDE lessons, writing task, tick box per section, page numbers) and lets you choose where to save it. Premium: 1 download per rolling 24 hours (then "Available again in Xh Ym"); super: unlimited; free accounts see a lock note. The limit is enforced by the database (same tables and functions as the web app); backing out of the save dialog gives the download back.
- **Grammar chapter PDFs (premium and super)**: each Grammar day shows an "Open A1-A2 ch. 1, 4" button per book that fetches a small PDF of just those chapters (the same function as the web app, which also enforces the tier) and reads it inside the app with Back and zoom (1x / 1.5x / 2x). Free accounts see a lock note instead.
- **Anki flashcards** with French pronunciation: today's new words (French to English), then review words from earlier days in a random direction (how many grows from about 5 to about 40 as days are completed; words you flag as hard come up five times as often), show answer, previous/next, the day's finish and streak, "Practice this day again" bonus rounds that don't change progress, reset. Audio uses the same text-to-speech function as the web app. Progress, hard words and card statistics are saved in the web app's exact format, so they are shared.
- **Writing with AI feedback**: write in French with a word count against the task's target, auto-save a second after you stop typing, ask for AI feedback (the same function and daily allowance as the web app: free 1, premium 5, super unlimited, rolling 24 hours, with the "N of M left" and "next one available in ..." lines, and the "AI is busy" message that doesn't use up your allowance), and keep the feedback with the day. Entries are saved in the web app's format, so they are shared.
- Grammar, Kwiziq, TV5MONDE and Writing: read the day, **Mark day complete**, streaks, "Day N done" and "All 301 days done" screens, reset progress. Saved to the same place and in the same format as the web app, so progress is shared. A failed load switches saving off so real progress is never overwritten. Kwiziq/TV5 lesson chips open a Google search for free accounts; **premium and super accounts get direct lesson links**: a chip with a known lesson page opens that page (📖) instead, and extra links for a day (such as Day 1's Me/te/nous/vous lesson) appear under the chips. The links come from the same database tables as the web app, which only hand them to premium and super accounts.
- A read-only day viewer for jumping to any day (with a button to practice that day's flashcards)
- Unit tests for the plan data, progress and streak logic

Everything the web app has is now built here.

## Verified
Compiles with Gradle 8.13 / AGP 8.10.1 / Kotlin 2.1.20 (`./gradlew :app:testDebugUnitTest :app:assembleDebug`): build succeeds, 70 unit tests pass, debug APK is about 10 MB. The exact server calls the app makes were also tested against the live backend. The app has been run on an Android 16 emulator: the day-plan PDF was drawn (accents, table, page breaks over several pages checked by eye), downloaded through the real save dialog, and the greyed-out button and refund-on-cancel were confirmed; the admin page was also run there (list, search, tier change, confirm/cancel for making someone super, locked own row). The other screens have not been walked through on a device yet. Emulator tests: `./gradlew connectedDebugAndroidTest` (needs a running emulator or phone).

## Run it
1. Install Android Studio and open the `android/` folder (Gradle sync runs automatically).
2. Pick an emulator or a phone with USB debugging, press Run.
3. Tests: `./gradlew test` (or run them from Android Studio). If Android Studio does not find the Android SDK, it creates `local.properties` for you (that file is not committed).

## Plan data
`app/src/main/assets/plan/*.json` is generated from the web app's data
(`frontend/src/data`) by `node tools/export-plan-data.mjs` (run from the repo root).
