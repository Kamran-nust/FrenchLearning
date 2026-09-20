# French NCLC 7 - iPhone app (Swift + SwiftUI)

A native rewrite of the study app for iPhone, using the same Supabase backend
as the web app (same accounts, tiers and saved progress).

**Building requires a Mac with Xcode** (Apple does not allow iOS builds on
Windows). Running on a real iPhone needs a free Apple ID; publishing to the App
Store needs a paid Apple Developer account.

## Status: foundation (phase 1)

Word Bank and Anki daily limits (written, not yet compiled): "Word Bank" on Home is a personal word list for Premium (45 starter words, up to 500 of their own) and Super (148 starter words); its words join the Anki reviews from the next session. Anki shows "Words today: N of LIMIT" (Free 30, Premium 200, Super none), stops new sessions once the day's limit is used, and Super's day is 25 cards rising to 50.

Plans screen (Free vs Premium, monthly/yearly; In-App Purchase is a placeholder), Forgot password and Delete my account (not for Super): all written, not yet compiled.

Jump to a day: Back from a section opened via a day page returns to that day page (written, not yet compiled).

Working in this phase (the same scope as the Android app):
- Sign in with email or username, create an account, log out (session kept in the iOS Keychain)
- Signed-in strip with tier (Free / Premium / Super)
- Four colour themes (same tokens as the web app)
- Home screen with "Day N complete" progress across all five sections
- **Admin page (super users only)**: on Home, "Admin: manage users" lists every user with their tier, join date, last sign-in and recent AI-feedback use; search by email or username, count chips per tier, and change a tier from a menu. Your own row is locked, making someone super asks for confirmation first, and the list only changes once the database accepts the change (otherwise the reason is shown). Both database functions refuse anyone who is not a super user, and the last super user can't be removed.
- **Day-plan PDF download (premium and super)**: the same as the Android app; the PDF is saved through the share sheet ("Save to Files"). Premium 1 per rolling 24 hours, super unlimited, free sees a lock note.
- **Direct lesson links (premium and super)**: Kwiziq and TV5MONDE chips open the real lesson page when one is known, with extra per-day links, the same as the web app and the Android app; free accounts keep the Google searches.
- **Grammar chapter PDFs (premium and super)**: the same as the Android app, read in Apple's PDF viewer (pinch to zoom). Free accounts see a lock note.
- **Anki flashcards** with French pronunciation: today's new words (French to English), then review words from earlier days in a random direction (how many grows from about 5 to about 40 as days are completed; words you flag as hard come up five times as often), show answer, previous/next, the day's finish and streak, "Practice this day again" bonus rounds that don't change progress, reset. Audio uses the same text-to-speech function as the web app. Progress, hard words and card statistics are saved in the web app's exact format, so they are shared.
- **Writing with AI feedback**: the same behaviour as the Android app (word count, auto-save, AI feedback within your daily allowance, entries shared with the web app)
- Grammar, Kwiziq, TV5MONDE and Writing: read the day, **Mark day complete**, streaks, "Day N done" and "All 301 days done" screens, reset progress (same behaviour and same saved format as the web app and the Android app)
- A read-only day viewer for jumping to any day (with a button to practice that day's flashcards)
- Unit tests for the plan data, progress and streak logic

Everything the web app has is now built here.

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
