import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { PRICES, YEARLY_SAVING, YEARLY_PER_MONTH, YEARLY_FREE_MONTHS, AI_FEEDBACK_PER_DAY } from "../shared/plans";

let mockTier = "free";
const invoke = vi.fn();

vi.mock("../lib/supabaseClient", () => ({
  supabase: { functions: { invoke: (...a) => invoke(...a) } },
}));
vi.mock("../TierContext.jsx", () => ({
  useTier: () => ({ tier: mockTier, loading: false }),
}));

const { default: PlansScreen } = await import("../screens/PlansScreen.jsx");

describe("plan prices", () => {
  it("yearly saves $24, which is 2 months free, $10 a month", () => {
    expect(PRICES.monthly.amount).toBe(12);
    expect(PRICES.yearly.amount).toBe(120);
    expect(YEARLY_SAVING).toBe(24);
    expect(YEARLY_PER_MONTH).toBe(10);
    expect(YEARLY_FREE_MONTHS).toBe(2);
  });

  it("matches the AI feedback limits set in the database migration", () => {
    expect(AI_FEEDBACK_PER_DAY).toEqual({ free: 1, premium: 5 });
  });
});

describe("Plans screen", () => {
  afterEach(() => {
    cleanup();
    invoke.mockReset();
    mockTier = "free";
  });

  it("starts on yearly and switches to monthly", () => {
    render(<PlansScreen onBack={() => {}} />);
    expect(screen.getByText("$120")).toBeTruthy();
    expect(screen.getByText("Best value")).toBeTruthy();
    fireEvent.click(screen.getByText("Monthly"));
    expect(screen.getByText("$12")).toBeTruthy();
    expect(screen.queryByText("Best value")).toBeNull();
  });

  it("lists the Free and Premium differences", () => {
    render(<PlansScreen onBack={() => {}} />);
    expect(screen.getByText("Grammar chapter PDFs")).toBeTruthy();
    expect(screen.getByText("Search only")).toBeTruthy();
    expect(screen.getAllByText("1 per day").length).toBe(2); // Free AI feedback, Premium day-plan PDF
    expect(screen.getAllByText("5 per day").length).toBe(1);
  });

  it("says payments aren't switched on while Stripe isn't set up", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 503, json: async () => ({ code: "not_configured" }) } },
    });
    render(<PlansScreen onBack={() => {}} />);
    fireEvent.click(screen.getByText("Upgrade to Premium"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/aren't switched on/));
    expect(invoke).toHaveBeenCalledWith("billing", { body: { action: "checkout", plan: "yearly" } });
    // and the button works again afterwards
    expect(screen.getByText("Upgrade to Premium").closest("button").disabled).toBe(false);
  });

  it("sends the chosen plan to checkout", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 500, json: async () => ({}) } } });
    render(<PlansScreen onBack={() => {}} />);
    fireEvent.click(screen.getByText("Monthly"));
    fireEvent.click(screen.getByText("Upgrade to Premium"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Couldn't start checkout/));
    expect(invoke).toHaveBeenCalledWith("billing", { body: { action: "checkout", plan: "monthly" } });
  });

  it("shows a premium user their plan and a manage button, not the upgrade button", () => {
    mockTier = "premium";
    render(<PlansScreen onBack={() => {}} />);
    expect(screen.queryByText("Upgrade to Premium")).toBeNull();
    expect(screen.getByText("Your current plan")).toBeTruthy();
    expect(screen.getByText("Manage subscription")).toBeTruthy();
  });

  it("tells a super user that Super includes Premium", () => {
    mockTier = "super";
    render(<PlansScreen onBack={() => {}} />);
    expect(screen.getByText(/You have Super/)).toBeTruthy();
    expect(screen.queryByText("Manage subscription")).toBeNull();
  });
});
