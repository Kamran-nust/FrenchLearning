import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

let mockTier = "free";
const invoke = vi.fn();
const resetPasswordForEmail = vi.fn();
const signOut = vi.fn();

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    functions: { invoke: (...a) => invoke(...a) },
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      resetPasswordForEmail: (...a) => resetPasswordForEmail(...a),
      signInWithPassword: async () => ({ error: null }),
      signOut: (...a) => signOut(...a),
    },
  },
}));
vi.mock("../TierContext.jsx", () => ({
  useTier: () => ({ tier: mockTier, loading: false, can: () => false }),
  TierProvider: ({ children }) => children,
}));

const { canConfirmDelete, deleteAccount, AccountDeletionError } = await import("../lib/accountDeletion");
const { default: DeleteAccountScreen } = await import("../screens/DeleteAccountScreen.jsx");
const { default: AuthGate } = await import("../AuthGate.jsx");

afterEach(() => {
  cleanup();
  invoke.mockReset();
  resetPasswordForEmail.mockReset();
  signOut.mockReset();
  mockTier = "free";
});

describe("deleting an account: the rules", () => {
  it("needs the word DELETE and a password", () => {
    expect(canConfirmDelete("DELETE", "secret")).toBe(true);
    expect(canConfirmDelete(" DELETE ", "secret")).toBe(true);
    expect(canConfirmDelete("delete", "secret")).toBe(false);
    expect(canConfirmDelete("DELETE", "")).toBe(false);
    expect(canConfirmDelete("", "secret")).toBe(false);
  });

  it("turns the server's answers into clear errors", async () => {
    const reply = (status, body) => ({ data: null, error: { context: { status, json: async () => body } } });
    invoke.mockResolvedValueOnce(reply(403, { code: "wrong_password" }));
    await expect(deleteAccount("x")).rejects.toMatchObject({ code: "wrong_password" });
    invoke.mockResolvedValueOnce(reply(403, { code: "super_not_allowed" }));
    await expect(deleteAccount("x")).rejects.toMatchObject({ code: "super_not_allowed" });
    invoke.mockResolvedValueOnce(reply(401, {}));
    await expect(deleteAccount("x")).rejects.toBeInstanceOf(AccountDeletionError);
    invoke.mockResolvedValueOnce({ data: { ok: true }, error: null });
    await expect(deleteAccount("x")).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("delete-account", { body: { password: "x" } });
  });
});

describe("delete account screen", () => {
  it("keeps the button off until both confirmations are filled in", () => {
    render(<DeleteAccountScreen onBack={() => {}} />);
    const button = screen.getByText("Delete my account").closest("button");
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Your password"), { target: { value: "secret" } });
    expect(button.disabled).toBe(false);
  });

  it("says when the password is wrong and does not delete", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 403, json: async () => ({ code: "wrong_password" }) } },
    });
    render(<DeleteAccountScreen onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.change(screen.getByLabelText("Your password"), { target: { value: "nope" } });
    fireEvent.click(screen.getByText("Delete my account"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/isn't right/));
    expect(screen.queryByText("Account deleted")).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("confirms the deletion and then signs out", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    render(<DeleteAccountScreen onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.change(screen.getByLabelText("Your password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByText("Delete my account"));
    await screen.findByText("Account deleted");
    fireEvent.click(screen.getByText("Continue"));
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("is not offered to super accounts", () => {
    mockTier = "super";
    render(<DeleteAccountScreen onBack={() => {}} />);
    expect(screen.getByText("Super accounts can't be deleted here.")).toBeTruthy();
    expect(screen.queryByText("Delete my account")).toBeNull();
  });
});

describe("forgot password", () => {
  beforeEach(() => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  async function openForgot() {
    render(
      <AuthGate>
        <div>the app</div>
      </AuthGate>,
    );
    fireEvent.click(await screen.findByText("Forgot password?"));
  }

  it("is on the sign-in screen and asks for an email", async () => {
    await openForgot();
    expect(screen.getByText("Reset your password")).toBeTruthy();
    expect(screen.getByText("Send reset link")).toBeTruthy();
  });

  it("sends the link, telling nothing about whether the account exists", async () => {
    await openForgot();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "me@example.com" } });
    fireEvent.click(screen.getByText("Send reset link"));
    await screen.findByText(/If an account exists for/);
    expect(resetPasswordForEmail).toHaveBeenCalledWith("me@example.com", { redirectTo: window.location.origin });
  });

  it("shows the reason when sending fails (for example too many requests)", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: { message: "Email rate limit exceeded" } });
    await openForgot();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "me@example.com" } });
    fireEvent.click(screen.getByText("Send reset link"));
    await screen.findByText("Email rate limit exceeded");
  });

  it("goes back to sign in", async () => {
    await openForgot();
    fireEvent.click(screen.getByText("Back to sign in"));
    expect(await screen.findByText("Forgot password?")).toBeTruthy();
  });
});
