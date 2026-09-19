# French NCLC 7 - iPhone app (Swift + SwiftUI)

A native rewrite of the study app for iPhone, using the same Supabase backend
as the web app (same accounts, tiers and saved progress).

**Building requires a Mac with Xcode** (Apple does not allow iOS builds on
Windows). Running on a real iPhone needs a free Apple ID; publishing to the App
Store needs a paid Apple Developer account.

## Status: foundation (phase 1)

Working in this phase (the same scope as the Android app):
- Sign in with email or username, create an account, log out (session kept in the iOS Keychain)
- Signed-in strip with tier (Free / Premium / Super)
- Four colour themes (same tokens as the web app)
- Home screen with "Day N complete" progress across all five sections
- **Writing with AI feedback**: the same behaviour as the Android app (word count, auto-save, AI feedback within your daily allowance, entries shared with the web app)
- Grammar, Kwiziq, TV5MONDE and Writing: read the day, **Mark day complete**, streaks, "Day N done" and "All 301 days done" screens, reset progress (same behaviour and same saved format as the web app and the Android app)
- Read-only day viewer for Anki (flashcard sessions not built yet) and for jumping to any day
- Unit tests for the plan data, progress and streak logic

Not built yet: Anki sessions, Grammar PDFs,
direct lesson links, day-plan PDF download, admin page, text-to-speech.

## Run it (on a Mac)
```bash
brew install xcodegen      # once
cd ios
xcodegen                   # creates FrenchNCLC7.xcodeproj from project.yml
open FrenchNCLC7.xcodeproj
```
Then choose an iPhone simulator and press Run. Tests: Product > Test (Cmd+U).

The `.xcodeproj` is generated, so it is not committed; edit `project.yml` to change project settings.
This code was written without access to a Mac, so it has not been compiled yet: expect to fix a few small
compiler complaints on first build.

## Plan data
`FrenchNCLC7/Resources/plan/*.json` is generated from the web app's data
(`frontend/src/data`) by `node tools/export-plan-data.mjs` (run from the repo root).
