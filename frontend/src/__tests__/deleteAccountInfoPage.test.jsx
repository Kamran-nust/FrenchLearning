import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { isDeleteAccountInfoPath } from "../shared/publicPages";

let mockEmail = "";
vi.mock("../shared/siteConfig", () => ({
  get SUPPORT_EMAIL() {
    return mockEmail;
  },
}));

const { default: DeleteAccountInfoPage } = await import("../screens/DeleteAccountInfoPage.jsx");

afterEach(() => {
  cleanup();
  mockEmail = "";
});

describe("public deletion page address", () => {
  it("matches /delete-account however it is typed, and nothing else", () => {
    expect(isDeleteAccountInfoPath("/delete-account")).toBe(true);
    expect(isDeleteAccountInfoPath("/delete-account/")).toBe(true);
    expect(isDeleteAccountInfoPath("/Delete-Account")).toBe(true);
    expect(isDeleteAccountInfoPath("/")).toBe(false);
    expect(isDeleteAccountInfoPath("/delete-account/extra")).toBe(false);
    expect(isDeleteAccountInfoPath(undefined)).toBe(false);
  });
});

describe("public deletion page", () => {
  it("explains the steps and what is deleted, with no sign-in needed", () => {
    render(<DeleteAccountInfoPage />);
    expect(screen.getByRole("heading", { name: "Delete your account" })).toBeTruthy();
    expect(screen.getAllByText("Delete my account").length).toBeGreaterThan(0);
    expect(screen.getByText(/Your Word Bank and any words you added/)).toBeTruthy();
    expect(screen.getByText(/Cancel it in that store's subscription settings first/)).toBeTruthy();
    expect(screen.getByText(/Super \(administrator\) accounts can't be deleted/)).toBeTruthy();
  });

  it("shows the contact email only once one is set", () => {
    render(<DeleteAccountInfoPage />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/contact us through the app's store page/)).toBeTruthy();
    cleanup();
    mockEmail = "support@example.com";
    render(<DeleteAccountInfoPage />);
    const link = screen.getByRole("link", { name: "support@example.com" });
    expect(link.getAttribute("href")).toBe("mailto:support@example.com?subject=Delete%20my%20account");
  });

  it("sets the tab title", () => {
    render(<DeleteAccountInfoPage />);
    expect(document.title).toBe("Delete your account - French NCLC 7");
  });
});
