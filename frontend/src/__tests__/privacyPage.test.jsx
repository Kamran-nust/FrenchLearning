import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { isPrivacyPath, isDeleteAccountInfoPath } from "../shared/publicPages";

let mockEmail = "";
vi.mock("../shared/siteConfig", () => ({
  get SUPPORT_EMAIL() {
    return mockEmail;
  },
}));

const { default: PrivacyPolicyPage } = await import("../screens/PrivacyPolicyPage.jsx");

afterEach(() => {
  cleanup();
  mockEmail = "";
});

describe("public page addresses", () => {
  it("matches /privacy however it is typed, and keeps the two public routes separate", () => {
    expect(isPrivacyPath("/privacy")).toBe(true);
    expect(isPrivacyPath("/privacy/")).toBe(true);
    expect(isPrivacyPath("/Privacy")).toBe(true);
    expect(isPrivacyPath("/")).toBe(false);
    expect(isPrivacyPath("/delete-account")).toBe(false);
    expect(isDeleteAccountInfoPath("/privacy")).toBe(false);
  });
});

describe("privacy policy page", () => {
  it("covers what stores require, with no sign-in", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole("heading", { name: "Privacy policy" })).toBeTruthy();
    // the real data flows are disclosed
    expect(screen.getByText(/Gemini API/)).toBeTruthy();
    expect(screen.getByText(/Text-to-Speech/)).toBeTruthy();
    expect(screen.getByText(/Supabase/)).toBeTruthy();
    expect(screen.getByText(/no third-party advertising or analytics/)).toBeTruthy();
    // links to the deletion flow
    expect(screen.getByText("account deletion page").getAttribute("href")).toBe("/delete-account");
    expect(document.title).toBe("Privacy policy - French NCLC 7");
  });

  it("points to the store when no support email is set, and to email once it is", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/contact us through the app's page/)).toBeTruthy();
    expect(screen.queryByText(/mailto/)).toBeNull();
    cleanup();
    mockEmail = "help@example.com";
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole("link", { name: "help@example.com" }).getAttribute("href")).toBe("mailto:help@example.com");
  });
});
