import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthGate from "./AuthGate.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./index.css";
import { initTheme } from "./shared/themes";

initTheme();

// Two safety nets: the outer one covers sign-in itself; the inner one wraps
// the app so a crashing screen still leaves the top strip (and Log out) usable.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthGate>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthGate>
    </ErrorBoundary>
  </React.StrictMode>,
);
