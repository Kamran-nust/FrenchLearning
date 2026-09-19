# French NCLC 7 - Android app (Kotlin + Jetpack Compose)

A native rewrite of the study app for Android, using the same Supabase backend
as the web app (same accounts, tiers and saved progress).

## Status: foundation (phase 1)

Working in this phase:
- Sign in with email or username, create an account, log out (session remembered on the phone)
- Signed-in strip with tier (Free / Premium / Super)
- Four colour themes (same tokens as the web app)
- Home screen with "Day N complete" progress across all five sections (read from the same saved progress as the web app)
- **Anki flashcards** with French pronunciation: today's new words (French to English), then review words from earlier days in a random direction (how many grows from about 5 to about 40 as days are completed; words you flag as hard come up five times as often), show answer, previous/next, the day's finish and streak, "Practice this day again" bonus rounds that don't change progress, reset. Audio uses the same text-to-speech function as the web app. Progress, hard words and card statistics are saved in the web app's exact format, so they are shared.
- **Writing with AI feedback**: write in French with a word count against the task's target, auto-save a second after you stop typing, ask for AI feedback (the same function and daily allowance as the web app: free 1, premium 5, super unlimited, rolling 24 hours, with the "N of M left" and "next one available in ..." lines, and the "AI is busy" message that doesn't use up your allowance), and keep the feedback with the day. Entries are saved in the web app's format, so they are shared.
- Grammar, Kwiziq, TV5MONDE and Writing: read the day, **Mark day complete**, streaks, "Day N done" and "All 301 days done" screens, reset progress. Saved to the same place and in the same format as the web app, so progress is shared. A failed load switches saving off so real progress is never overwritten. Kwiziq/TV5 lesson chips open a Google search (direct lesson links are a later premium feature).
- A read-only day viewer for jumping to any day (with a button to practice that day's flashcards)
- Unit tests for the plan data, progress and streak logic

Not built yet (the web app has these; each is a separate piece of work):
- Grammar PDFs, direct lesson links, day-plan PDF download, admin page.

## Verified
Compiles with Gradle 8.13 / AGP 8.10.1 / Kotlin 2.1.20 (`./gradlew :app:testDebugUnitTest :app:assembleDebug`): build succeeds, 43 unit tests pass, debug APK is about 10 MB. The exact server calls the app makes were also tested against the live backend. It has not yet been run on an emulator or phone.

## Run it
1. Install Android Studio and open the `android/` folder (Gradle sync runs automatically).
2. Pick an emulator or a phone with USB debugging, press Run.
3. Tests: `./gradlew test` (or run them from Android Studio). If Android Studio does not find the Android SDK, it creates `local.properties` for you (that file is not committed).

## Plan data
`app/src/main/assets/plan/*.json` is generated from the web app's data
(`frontend/src/data`) by `node tools/export-plan-data.mjs` (run from the repo root).
