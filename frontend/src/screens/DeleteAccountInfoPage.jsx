import { useEffect } from "react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { SUPPORT_EMAIL } from "../shared/siteConfig";

// The public "how to delete your account" page: reachable without signing in, at /delete-account. App stores
// ask for a web address like this one. It says how to delete an account in the app, exactly what is deleted, and
// how to ask for deletion when someone can't sign in.
export default function DeleteAccountInfoPage() {
  useEffect(() => {
    const before = document.title;
    document.title = "Delete your account - French NCLC 7";
    return () => {
      document.title = before;
    };
  }, []);

  const h2 = { fontFamily: "'Fraunces', serif", fontSize: "1.15rem" };
  const muted = { color: COLORS.muted };

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
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem" }} className="mb-3">
          Delete your account
        </h1>
        <p className="mb-6" style={muted}>
          You can delete your French NCLC 7 account and all the data saved with it at any time. This page explains how,
          and what happens when you do.
        </p>

        <h2 style={h2} className="mb-2">
          How to delete your account
        </h2>
        <p className="mb-2" style={muted}>
          The same steps work in the web app, the Android app and the iPhone app:
        </p>
        <ol className="list-decimal pl-5 mb-6 space-y-1">
          <li>Sign in to your account.</li>
          <li>
            On the Home screen, scroll to the bottom and tap <strong>Delete my account</strong>.
          </li>
          <li>
            Type <strong>DELETE</strong> and enter your password to confirm.
          </li>
          <li>
            Tap <strong>Delete my account</strong>. The deletion happens straight away.
          </li>
        </ol>
        <p className="mb-6 text-xs" style={muted}>
          Forgot your password? Choose <strong>Forgot password?</strong> on the sign-in screen, set a new one from the
          email we send you, and then delete your account.
        </p>

        <h2 style={h2} className="mb-2">
          What is deleted
        </h2>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>Your account: your email address, username and password.</li>
          <li>Your progress, streaks and Anki history in every section.</li>
          <li>Your Writing entries.</li>
          <li>Your Word Bank and any words you added.</li>
          <li>Your account level and usage counters (for example your daily AI feedback and download counts).</li>
        </ul>
        <p className="mb-6" style={muted}>
          Deletion is permanent and can't be undone. It removes your data from the live service straight away. We don't
          keep it for any other purpose.
        </p>

        <h2 style={h2} className="mb-2">
          If you have a paid subscription
        </h2>
        <p className="mb-6" style={muted}>
          Deleting your account does not cancel a subscription bought through Google Play, the App Store or the web.
          Cancel it in that store's subscription settings first, so you aren't charged again.
        </p>

        <h2 style={h2} className="mb-2">
          Super accounts
        </h2>
        <p className="mb-6" style={muted}>
          Super (administrator) accounts can't be deleted from the app.
          {SUPPORT_EMAIL ? " Email us to ask for it." : ""}
        </p>

        <h2 style={h2} className="mb-2">
          Can't sign in?
        </h2>
        {SUPPORT_EMAIL ? (
          <p className="mb-6" style={muted}>
            If you can't sign in and can't reset your password, email{" "}
            <a
              href={"mailto:" + SUPPORT_EMAIL + "?subject=Delete%20my%20account"}
              className="underline"
              style={{ color: COLORS.link }}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            from the address you signed up with, with the subject "Delete my account". We'll delete the account and
            confirm by email.
          </p>
        ) : (
          <p className="mb-6" style={muted}>
            If you can't sign in and can't reset your password, contact us through the app's store page and ask for your
            account to be deleted.
          </p>
        )}
      </main>
    </div>
  );
}
