# Google Play — store listing and Data Safety (draft)

Copy-paste material for the Play Console. Everything here reflects what the app actually does (from the
code and the security audit). Replace the bracketed placeholders. Keep it in sync if features change.

---

## Store listing

- **App name:** French NCLC 7
- **Short description** (max 80 chars):
  `Daily plan, flashcards, grammar and AI writing help for the French NCLC 7 exam`
- **Full description** (max 4000 chars):

```
French NCLC 7 is a focused, 301-day study plan for the French NCLC 7 / CLB 7 exam. Everything you
need for a day of study is in one place, and your progress syncs across the web, Android and iPhone
with a single account.

Each day brings five sections:
• Anki vocabulary — spaced-repetition flashcards with French pronunciation, both directions, and
  review words that grow as you progress.
• Grammar — a daily grammar focus tied to a well-known progressive grammar course.
• Kwiziq — the day's recommended online lessons.
• TV5MONDE — a daily listening exercise.
• Writing — a short daily writing task with word-count targets.

Track your streak, mark each day complete, and jump to any day of the plan. Build your own Word Bank
of words to revise, and they mix into your flashcard reviews automatically.

Premium adds AI feedback on your writing, direct links to lessons, grammar-chapter PDFs, a downloadable
day-plan PDF, and a larger daily vocabulary allowance.

Free to use, with an optional Premium subscription. Your progress, streaks and notes are saved to your
account so you can pick up where you left off on any device.
```

- **Category:** Education
- **Tags/keywords (if asked):** French, language learning, NCLC, CLB, flashcards, exam prep
- **Contact email:** [YOUR SUPPORT EMAIL]
- **Privacy policy URL:** https://french-learning-rouge.vercel.app/privacy
- **App icon (512×512):** `android/store/icon-512.png`
- **Feature graphic (1024×500):** not made yet — needed before publishing.
- **Screenshots:** 5 phone screenshots ready in `android/store/screenshots/` (1080x1920, 9:16):
  Home, an Anki flashcard, Writing + AI feedback, Word Bank, Plans. Add more or reorder as you like.

---

## Content rating questionnaire

Category **Education/Reference**; answer **No** to every content question (no violence, sexual content,
profanity, gambling, drugs, user-to-user communication, etc.). Expected result: **Everyone / PEGI 3**.
The app has no social features and no user-to-user messaging.

---

## Data Safety form

The Play Console asks these as a guided questionnaire. Answers below match the code.

### Overview
- **Does your app collect or share any of the required user data types?** Yes (collects; see below).
- **Is all data encrypted in transit?** Yes (all traffic is HTTPS).
- **Do you provide a way for users to request that their data is deleted?** Yes — in-app
  (Home → Delete my account) and the public page at `/delete-account`.

### Data collected

| Data type | Category | Collected | Shared | Purpose | Required? |
|---|---|---|---|---|---|
| Email address | Personal info | Yes | No | Account management, App functionality | Required |
| User IDs (username) | Personal info | Yes | No | Account management, App functionality | Required |
| Other user-generated content (Writing entries, Word Bank words, notes) | User content | Yes | See note ▼ | App functionality | Optional |
| Other app activity (study progress, streaks, flashcard history, usage counters) | App activity | Yes | No | App functionality | Optional |

**Note on "shared" / Google processing (Writing + pronunciation).** Two features send content to Google
to work: the AI writing feedback sends your writing task and draft to the Google Gemini API, and the
flashcard pronunciation sends the French word/phrase to Google Cloud Text-to-Speech. Under Google's
Data Safety definitions, sending data to a **service provider that only processes it on your behalf** is
generally **not** counted as "sharing." So the standard answer for these is **Collected: Yes, Shared:
No**, while the privacy policy still discloses the Google processing transparently (it does). If you
prefer the most conservative stance, you may instead mark Writing content as "Shared" with the purpose
"App functionality." Either is defensible; the privacy policy already explains it.

### Data NOT collected (answer No / leave unchecked)
- Location, Contacts, Photos/videos, Files, Calendar, Health, SMS/call logs.
- Financial info / payment info — the app collects no payment data; if subscriptions go live, Google
  Play handles payment and we never receive card details.
- Device or other identifiers, advertising ID — none.
- App info and performance (crash logs, diagnostics) — no analytics or crash-reporting SDK is present.

### Security-log nuance (IP address)
On a **failed** sign-in, the server briefly records the attempted username and the IP address, used
**only** to rate-limit password guessing, then auto-deletes them. Google's Data Safety has a carve-out
for data used **solely** for security/fraud-prevention and processed ephemerally; this typically does
not need to be declared as collected. If the questionnaire pushes you to declare it, use purpose
"Fraud prevention, security, and compliance." (This is anti-abuse only, never used for tracking.)

---

## Other Console sections
- **Ads:** No, this app does not contain ads.
- **Target audience:** adults / 18+ (exam preparation); not designed for children — keeps it out of the
  Families program.
- **Government app / COVID / financial features:** No.
- **App access:** most features need a sign-in. Provide Google a test account (a throwaway Premium
  login) so reviewers can see Premium features, or note that Premium is enabled server-side.

## Still needed before you can publish
1. Signing keystore generated and `keystore.properties` filled in (see android/README.md), then
   `bundleRelease` and upload the `.aab`.
2. A support/contact email (also fills `SUPPORT_EMAIL` so the privacy + deletion pages show it).
3. Feature graphic (1024x500). Screenshots are done (android/store/screenshots/).
4. Confirm the privacy policy URL resolves on your live domain.
