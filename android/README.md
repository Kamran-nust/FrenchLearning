# French NCLC 7 - Android app (Kotlin + Jetpack Compose)

A native rewrite of the study app for Android, using the same Supabase backend
as the web app (same accounts, tiers and saved progress).

## Status: foundation (phase 1)

Working in this phase:
- Sign in with email or username, create an account, log out (session remembered on the phone)
- Signed-in strip with tier (Free / Premium / Super)
- Four colour themes (same tokens as the web app)
- Home screen with "Day N complete" progress across all five sections (read from the same saved progress as the web app)
- Read-only day viewer for all five sections (Anki cards, Grammar, Kwiziq, TV5MONDE, Writing) for any of the 301 days
- Unit tests for the plan data and progress logic

Not built yet (the web app has these; each is a separate piece of work):
- Anki flashcard sessions, Grammar/Kwiziq/TV5 "mark day complete" + streaks, Writing editor + AI feedback,
  Grammar PDFs, direct lesson links, day-plan PDF download, admin page, text-to-speech.

## Verified
Compiles with Gradle 8.13 / AGP 8.10.1 / Kotlin 2.1.20 (`./gradlew :app:testDebugUnitTest :app:assembleDebug`): build succeeds, 6 unit tests pass, debug APK is about 10 MB. The exact server calls the app makes were also tested against the live backend. It has not yet been run on an emulator or phone.

## Run it
1. Install Android Studio and open the `android/` folder (Gradle sync runs automatically).
2. Pick an emulator or a phone with USB debugging, press Run.
3. Tests: `./gradlew test` (or run them from Android Studio). If Android Studio does not find the Android SDK, it creates `local.properties` for you (that file is not committed).

## Plan data
`app/src/main/assets/plan/*.json` is generated from the web app's data
(`frontend/src/data`) by `node tools/export-plan-data.mjs` (run from the repo root).
