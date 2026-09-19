import { Component } from "react";
import { COLORS } from "./shared/theme.jsx";

// Catches an error thrown while rendering anything inside it, so one bug
// shows a friendly message instead of a blank page. "Try again" re-mounts the
// contents from scratch; "Reload" restarts the whole app. Progress is saved
// as you go, so neither loses anything already saved.
//
// Errors in event handlers and async code are not caught by React boundaries
// (those are handled where they happen).
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Screen crashed:", error, info && info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        <div className="max-w-sm text-center">
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.4rem" }} className="mb-2">
            Something went wrong
          </h1>
          <p className="text-sm mb-5" style={{ color: COLORS.muted }}>
            This screen hit an unexpected problem. Your saved progress is safe. Try again, or reload the page.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => this.setState({ failed: false })}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: COLORS.accent, color: COLORS.onAccent }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: COLORS.card, color: COLORS.text, border: "1px solid " + COLORS.border }}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
