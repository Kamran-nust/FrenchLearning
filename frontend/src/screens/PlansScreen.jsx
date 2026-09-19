import { useState } from "react";
import { ChevronLeft, Check, Minus, Loader2 } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { useTier } from "../TierContext.jsx";
import { startCheckout, openBillingPortal } from "../lib/billing";
import { PRICES, YEARLY_SAVING, YEARLY_PER_MONTH, YEARLY_FREE_MONTHS, FEATURE_GROUPS } from "../shared/plans";

function Cell({ value }) {
  if (value === true) return <Check size={16} color={COLORS.accent} aria-label="Included" />;
  if (value === false) return <Minus size={16} color={COLORS.muted} aria-label="Not included" />;
  return <span style={{ color: COLORS.muted }}>{value}</span>;
}

const MESSAGES = {
  not_configured: "Payments aren't switched on yet. Please check back soon.",
  sign_in: "Your session expired. Sign in again to continue.",
  other: "Couldn't start checkout. Try again in a moment.",
};

export default function PlansScreen({ onBack }) {
  const { tier, loading } = useTier();
  const [period, setPeriod] = useState("yearly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const yearly = period === "yearly";
  const price = PRICES[period];
  const isPaid = tier === "premium" || tier === "super";

  async function go(action) {
    setBusy(true);
    setMessage("");
    try {
      const url = await (action === "portal" ? openBillingPortal() : startCheckout(period));
      window.location.assign(url);
    } catch (e) {
      setMessage(MESSAGES[e && e.code] || MESSAGES.other);
      setBusy(false);
    }
  }

  const card = { background: COLORS.card, border: "1px solid " + COLORS.border };

  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="min-h-screen"
    >
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Plans
          </div>
        </div>

        <div className="text-center mb-5">
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.4rem" }} className="mb-1">
            Study every day for NCLC 7, with less friction
          </h2>
          <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
            Cancel anytime. Your progress always stays with you.
          </p>
          <div role="group" aria-label="Billing period" className="inline-flex rounded-full p-1" style={card}>
            {["monthly", "yearly"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className="px-4 py-1.5 rounded-full text-xs"
                style={{
                  background: period === p ? COLORS.text : "transparent",
                  color: period === p ? COLORS.bg : COLORS.muted,
                }}
              >
                {p === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl p-4" style={card}>
            <div className="text-xs" style={{ color: COLORS.muted }}>
              Free
            </div>
            <div className="text-2xl font-medium">$0</div>
            <div className="text-xs mb-2" style={{ color: COLORS.muted }}>
              forever
            </div>
            <p className="text-xs" style={{ color: COLORS.muted }}>
              The full 301-day plan, all five sections.
            </p>
            {tier === "free" && !loading && (
              <div
                className="mt-3 text-center text-sm py-2.5 rounded-xl"
                style={{ background: COLORS.accentSoft, color: COLORS.muted }}
              >
                Your current plan
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4" style={{ ...card, border: "2px solid " + COLORS.accent }}>
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: COLORS.muted }}>
                Premium
              </div>
              {yearly && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-lg"
                  style={{ background: COLORS.accentSoft, color: COLORS.link }}
                >
                  Best value
                </span>
              )}
            </div>
            <div>
              <span className="text-2xl font-medium">{price.label}</span>{" "}
              <span className="text-xs" style={{ color: COLORS.muted }}>
                {price.per}
              </span>
            </div>
            <div className="text-xs mb-2" style={{ color: COLORS.link }}>
              {yearly
                ? "$" + YEARLY_PER_MONTH + " a month. " + YEARLY_FREE_MONTHS + " months free, save $" + YEARLY_SAVING
                : "Billed monthly. Switch to yearly and save $" + YEARLY_SAVING}
            </div>
            <p className="text-xs" style={{ color: COLORS.muted }}>
              Real lesson links, PDFs, and more AI feedback.
            </p>

            {!loading && tier === "free" && (
              <button
                onClick={() => go("checkout")}
                disabled={busy}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{ background: COLORS.accent, color: COLORS.onAccent, opacity: busy ? 0.7 : 1 }}
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Upgrade to Premium
              </button>
            )}
            {!loading && isPaid && (
              <>
                <div
                  className="mt-3 text-center text-sm py-2.5 rounded-xl"
                  style={{ background: COLORS.accentSoft, color: COLORS.muted }}
                >
                  {tier === "super" ? "You have Super, which includes Premium" : "Your current plan"}
                </div>
                {tier === "premium" && (
                  <button
                    onClick={() => go("portal")}
                    disabled={busy}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm"
                    style={{ ...card, color: COLORS.link, opacity: busy ? 0.7 : 1 }}
                  >
                    Manage subscription
                  </button>
                )}
              </>
            )}
            {message && (
              <p role="alert" className="text-xs mt-2 text-center" style={{ color: COLORS.muted }}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl mt-3 px-4 py-2" style={card}>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: COLORS.muted }}>
                <th className="text-left font-medium py-2">Feature</th>
                <th className="font-medium py-2 w-20">Free</th>
                <th className="font-medium py-2 w-20">Premium</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_GROUPS.map((g) => [
                <tr key={g.title}>
                  <td
                    colSpan={3}
                    className="py-1.5 px-2 rounded"
                    style={{ background: COLORS.accentSoft, color: COLORS.muted }}
                  >
                    {g.title}
                  </td>
                </tr>,
                ...g.rows.map((r) => (
                  <tr key={r.label} style={{ borderTop: "1px solid " + COLORS.border }}>
                    <td className="py-2 pr-2">{r.label}</td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center">
                        <Cell value={r.free} />
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center">
                        <Cell value={r.premium} />
                      </div>
                    </td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-center mt-3" style={{ color: COLORS.muted }}>
          Secure checkout by Stripe. We never see your card details.
        </p>
      </div>
    </div>
  );
}
