import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// The sections themselves are not under test here, only how Back moves between screens.
vi.mock("../modules/GrammarModule.jsx", () => ({
  default: ({ onBack, startDay }) => (
    <div>
      <span>Grammar opened on day {String(startDay)}</span>
      <button onClick={onBack}>Back from Grammar</button>
    </div>
  ),
}));
for (const name of ["Kwiziq", "Tv5", "Writing", "Anki"]) {
  vi.doMock("../modules/" + name + "Module.jsx", () => ({ default: () => <div>{name}</div> }));
}
vi.mock("../lib/overallProgress", () => ({ loadFullyCompletedThrough: async () => 0 }));
vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    rpc: async () => ({ data: null, error: {} }),
    from: () => ({}),
    auth: { getSession: async () => ({ data: {} }) },
  },
}));

const { default: App } = await import("../App.jsx");

function jumpToDay(n) {
  fireEvent.click(screen.getByText("Jump to a day"));
  fireEvent.change(screen.getByPlaceholderText("1–301"), { target: { value: String(n) } });
  fireEvent.click(screen.getByText("Go"));
}

describe("Back from a section opened via Jump to a day", () => {
  afterEach(cleanup);

  it("returns to the same day's page, with the day still chosen", () => {
    render(<App />);
    jumpToDay(50);
    expect(screen.getByText("Day 50 · Week 8")).toBeTruthy();

    // sections on that day: Anki, Grammar, Kwiziq, TV5MONDE, Writing - each has an Open button
    fireEvent.click(screen.getAllByText("Open")[1]);
    expect(screen.getByText("Grammar opened on day 50")).toBeTruthy();

    fireEvent.click(screen.getByText("Back from Grammar"));
    expect(screen.getByText("Day 50 · Week 8")).toBeTruthy();
    expect(screen.getByPlaceholderText("1–301").value).toBe("50");
  });

  it("goes back to Home from that page, and the next visit starts blank", () => {
    render(<App />);
    jumpToDay(50);
    fireEvent.click(screen.getAllByText("Open")[1]);
    fireEvent.click(screen.getByText("Back from Grammar"));

    fireEvent.click(screen.getByLabelText("Back to home"));
    expect(screen.getByText("A DAILY LANGUAGE JOURNEY")).toBeTruthy();

    fireEvent.click(screen.getByText("Jump to a day"));
    expect(screen.getByPlaceholderText("1–301").value).toBe("");
    expect(screen.queryByText(/Day 50 · Week/)).toBeNull();
  });

  it("remembers a newly chosen day, not the first one", () => {
    render(<App />);
    jumpToDay(50);
    fireEvent.change(screen.getByPlaceholderText("1–301"), { target: { value: "120" } });
    fireEvent.click(screen.getByText("Go"));
    fireEvent.click(screen.getAllByText("Open")[1]);
    expect(screen.getByText("Grammar opened on day 120")).toBeTruthy();
    fireEvent.click(screen.getByText("Back from Grammar"));
    expect(screen.getByText("Day 120 · Week 18")).toBeTruthy();
  });

  it("opening a section straight from Home still returns to Home", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Grammar book"));
    expect(screen.getByText("Grammar opened on day null")).toBeTruthy();
    fireEvent.click(screen.getByText("Back from Grammar"));
    expect(screen.getByText("A DAILY LANGUAGE JOURNEY")).toBeTruthy();
  });
});
