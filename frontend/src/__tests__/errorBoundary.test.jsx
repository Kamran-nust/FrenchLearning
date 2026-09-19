import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary.jsx";

let shouldCrash = true;
function Bomb() {
  if (shouldCrash) throw new Error("boom");
  return <div>all good</div>;
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    shouldCrash = true;
  });

  it("shows children when nothing is wrong", () => {
    shouldCrash = false;
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("all good")).toBeTruthy();
  });

  it("shows a friendly message instead of a blank page, and logs the error", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(log.mock.calls.some((c) => String(c[0]).includes("Screen crashed"))).toBe(true);
  });

  it("'Try again' recovers once the problem is gone", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    shouldCrash = false;
    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText("all good")).toBeTruthy();
  });
});
