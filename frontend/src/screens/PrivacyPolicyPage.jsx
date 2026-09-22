import { useEffect } from "react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { SUPPORT_EMAIL } from "../shared/siteConfig";
import { DELETE_ACCOUNT_PATH } from "../shared/publicPages";

// The public privacy policy: reachable without signing in, at /privacy. App stores require a privacy
// policy URL. Content reflects what the app actually collects and shares - keep it in sync with the code.
const LAST_UPDATED = "22 September 2026";

const h2 = { fontFamily: "'Fraunces', serif", fontSize: "1.15rem" };
const muted = { color: COLORS.muted };
const link = { color: COLORS.link };

function Section({ title, children }) {
  return (
    <>
      <h2 style={h2} className="mb-2 mt-6">
        {title}
      </h2>
      <div style={muted}>{children}</div>
    </>
  );
}

export default function PrivacyPolicyPage() {
  useEffect(() => {
    const before = document.title;
    document.title = "Privacy policy - French NCLC 7";
    return () => {
      document.title = before;
    };
  }, []);

  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="min-h-screen"
    >
      <GlobalStyle />
      <main className="w-full max-w-xl mx-auto px-6 py-10 text-sm leading-relaxed">
        <div className="text-xs mb-2" style={{ color: COLORS.gold, letterSpacing: 1 }}>
          FRENCH NCLC 7 PREPARATION PLAN
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem" }} className="mb-1">
          Privacy policy
        </h1>
        <p className="text-xs mb-4" style={muted}>
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mb-2" style={muted}>
          French NCLC 7 is a personal study app for the French NCLC 7 / CLB 7 exam, available on the web, Android and
          iPhone. This policy explains what data the app collects, why, and who it is shared with. The same policy
          applies to all three versions, which use one shared account.
        </p>

        <Section title="What we collect">
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>
              <strong>Your account:</strong> the email address, username and password you sign up with. Passwords are
              stored securely (hashed) by our authentication provider; we never see them in readable form.
            </li>
            <li>
              <strong>Your study data:</strong> your day-by-day progress and streaks, your Anki flashcard history, your
              Word Bank words, the text of your Writing entries, and usage counters (for example how many AI feedback
              requests or plan-PDF downloads you have made in a day).
            </li>
            <li>
              <strong>Security logs:</strong> when a sign-in attempt fails, we briefly record the username tried and the
              network (IP) address, only to slow down password guessing. These records are deleted automatically.
            </li>
          </ul>
          <p className="mt-2">
            We do not collect your location, contacts, photos, or advertising identifiers, and the app contains no
            third-party advertising or analytics/tracking tools.
          </p>
        </Section>

        <Section title="AI writing feedback and pronunciation">
          <p>
            Two features send content to Google to work. When you ask for feedback on a Writing entry, the writing task
            and the text you wrote are sent to Google's Gemini API, which returns the feedback shown only to you. When
            you play a flashcard's pronunciation, the French word or phrase is sent to Google Cloud Text-to-Speech to
            generate the audio. Google processes this content to provide those features. We do not send your email, name
            or other account details with these requests.
          </p>
        </Section>

        <Section title="Service providers">
          <p>We use a small number of providers to run the app, and share only what each needs to do its job:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>
              <strong>Supabase</strong> — stores your account and study data and runs the sign-in and server features.
            </li>
            <li>
              <strong>Vercel</strong> — hosts the web app.
            </li>
            <li>
              <strong>Google</strong> — provides the AI writing feedback and the flashcard pronunciation described
              above.
            </li>
          </ul>
          <p className="mt-2">We do not sell your data or share it with anyone for advertising.</p>
        </Section>

        <Section title="Subscriptions and payments">
          <p>
            The app does not collect or handle any payment information itself. If paid subscriptions are offered,
            payment is processed by the platform's own store — Google Play, the Apple App Store, or Stripe on the web —
            and card details are entered on their systems, not ours. We never receive or store your card number.
          </p>
        </Section>

        <Section title="How your data is protected">
          <p>
            All traffic between the apps and our servers uses encrypted connections (HTTPS). Your study data is
            protected by per-user access rules on the database, so one account can never read or change another
            account's data.
          </p>
        </Section>

        <Section title="Keeping and deleting your data">
          <p>
            We keep your account and study data for as long as your account exists, so your progress is there when you
            return. You can delete your account and everything saved with it at any time from inside the app (Home →
            Delete my account). Deletion is permanent and removes your data from the live service. See the{" "}
            <a href={DELETE_ACCOUNT_PATH} style={link} className="underline">
              account deletion page
            </a>{" "}
            for the steps.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The app is intended for adults and older learners preparing for a language exam. It is not directed at
            children, and we do not knowingly collect data from children under 13.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes, we will update this page and the &ldquo;last updated&rdquo; date above. Continued
            use of the app after a change means you accept the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          {SUPPORT_EMAIL ? (
            <p>
              Questions about this policy or your data? Email{" "}
              <a href={"mailto:" + SUPPORT_EMAIL} style={link} className="underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          ) : (
            <p>
              Questions about this policy or your data? Please contact us through the app's page on the Google Play
              Store or the Apple App Store.
            </p>
          )}
        </Section>
      </main>
    </div>
  );
}
